"""Offline recorder checks; no API key, package or network required."""
import importlib.util
import json
from pathlib import Path
import tempfile
import types
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('make_voices', Path(__file__).parents[1] / 'voice' / 'make_voices.py')
recorder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(recorder)


class RecorderTests(unittest.TestCase):
    def test_resume_retry_and_manifest(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            lines = [
                {'id': 'hammy-001', 'speaker': 'hammy', 'text': 'Hello!'},
                {'id': 'mom-001', 'speaker': 'mom', 'text': 'A cozy story.'},
            ]
            (root / 'lines.json').write_text(json.dumps(lines), encoding='utf-8')
            (root / 'clips').mkdir()
            (root / 'clips' / 'hammy-001.mp3').write_bytes(b'existing')
            calls = []

            class ConnectionError(Exception):
                pass

            class StatusError(Exception):
                status_code = 500

            class Response:
                def __enter__(self): return self
                def __exit__(self, *args): pass
                def stream_to_file(self, path): path.write_bytes(b'recorded')

            def create(**kwargs):
                calls.append(kwargs)
                if len(calls) == 1:
                    raise ConnectionError()
                return Response()

            client = types.SimpleNamespace(
                audio=types.SimpleNamespace(speech=types.SimpleNamespace(with_streaming_response=types.SimpleNamespace(create=create))),
                close=lambda: None,
            )
            sdk = types.SimpleNamespace(OpenAI=lambda **kwargs: client, APIConnectionError=ConnectionError,
                                        APIStatusError=StatusError, RateLimitError=StatusError)
            with patch.object(recorder, 'HERE', root), patch.dict('sys.modules', {'openai': sdk}), \
                 patch.dict('os.environ', {'OPENAI_API_KEY': 'test-only'}), \
                 patch('sys.argv', ['make_voices.py']), patch.object(recorder.time, 'sleep'):
                self.assertEqual(recorder.main(), 0)
                self.assertEqual(len(calls), 2)
                self.assertEqual(calls[-1]['input'], 'A cozy story.')
                self.assertEqual(calls[-1]['voice'], 'sage')
                self.assertEqual((root / 'clips' / 'hammy-001.mp3').read_bytes(), b'existing')
                self.assertFalse(list((root / 'clips').glob('*.part')))
                content = (root / 'clips' / 'manifest.js').read_text()
                data = json.loads(content.removeprefix('window.VOICE_CLIPS = ').strip().removesuffix(';'))
                self.assertEqual(data['mom']['A cozy story.'], 'mom-001.mp3')
                # A subsequent run makes no API requests.
                self.assertEqual(recorder.main(), 0)
                self.assertEqual(len(calls), 2)

    def test_manifest_ignores_missing_and_empty_files(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'clips').mkdir()
            (root / 'clips' / 'hammy-001.mp3').touch()
            with patch.object(recorder, 'HERE', root):
                recorder.manifest([{'id': 'hammy-001', 'speaker': 'hammy', 'text': 'Empty'}])
            self.assertNotIn('Empty', (root / 'clips' / 'manifest.js').read_text())


if __name__ == '__main__':
    unittest.main()
