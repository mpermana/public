from tkinter import Tk, Menu
# root window
root = Tk()
root.geometry('640x300')
root.title('DAS Software')
# create a menubar
menubar = Menu(root)
root.config(menu=menubar)
# create the file_menu
file_menu = Menu(
menubar,
tearoff=0
)
# add a submenu
file_load_submenu = Menu(file_menu, tearoff=0)
file_load_submenu.add_command(label='Load Data')
file_load_submenu.add_command(label='Load Program')
file_load_submenu.add_command(label='Load ScanList')
# add the File menu to the menubar
file_menu.add_cascade(
label="Load...",
menu=file_load_submenu
)
# add a submenu
file_save_submenu = Menu(file_menu, tearoff=0)
file_save_submenu.add_command(label='Save Data')
file_save_submenu.add_command(label='Save Program')
file_save_submenu.add_command(label='Save ScanList')
# add the File menu to the menubar
file_menu.add_cascade(
label="Save...",
menu=file_save_submenu
)
file_menu.add_command(label='Print')
file_menu.add_separator()
# add Exit menu item
file_menu.add_separator()
file_menu.add_command(
label='Exit',
command=root.destroy
)
menubar.add_cascade(
label="File",
menu=file_menu,
underline=0
)
# create the Step Programming menu
step_menu = Menu(
menubar,
tearoff=0
)
step_menu.add_command(label='Step Length')
step_menu.add_command(label='Step Period')
step_menu.add_command(label='Event Settings')
step_menu.add_command(label='Alarm Settings')
# add the Step Programming menu to the menubar
menubar.add_cascade(
label="Step Programming",
menu=step_menu,
underline=0
)
# create the Run Acquisitions menu
run_menu = Menu(
menubar,
tearoff=0
)
run_menu.add_command(label='Read & Check Data From Chamber & Instruments')
run_menu.add_command(label='Incidence Alarm & email to testers')
# add the Step Programming menu to the menubar
menubar.add_cascade(
label="Run Acquisitions",
menu=run_menu,
underline=0
)
# create the Data Processing menu
data_process_menu = Menu(
menubar,
tearoff=0
)
data_process_menu.add_command(label='Data View')
data_process_menu.add_command(label='Combine Data')
data_process_menu.add_command(label='Plot Data')
# add the menu to the menubar
menubar.add_cascade(
label="Data Processing",
menu=data_process_menu,
underline=0
)
# create the Data Storage & Transfer menu
data_storage_menu = Menu(
menubar,
tearoff=0
)
data_storage_menu.add_command(label='Save to Hard Disk')
data_storage_menu.add_command(label='Save to Cloud')
data_storage_menu.add_command(label='Save to USB')
# add the menu to the menubar
menubar.add_cascade(
label="Data Storage & Transfer",
menu=data_storage_menu,
underline=0
)
# create the Remote Control menu
remote_menu = Menu(
menubar,
tearoff=0
)
remote_menu.add_command(label='Turn On Website')
remote_menu.add_command(label='Turn Off Website')
# add the menu to the menubar
menubar.add_cascade(
label="Remote Control",
menu=remote_menu,
underline=0
)
# create the Configurateions menu
config_menu = Menu(
menubar,
tearoff=0
)
# add a submenu
config_select_submenu = Menu(file_menu, tearoff=0)
config_select_submenu.add_command(label='Chamber')
config_select_submenu.add_command(label='M300')
config_select_submenu.add_command(label='Oscilloscope')
# add the File menu to the menubar
config_menu.add_cascade(
label="Select Devices...",
menu=config_select_submenu
)
# config_menu.add_command(label='Select Devices...')
config_menu.add_command(label='Select Channels')
config_menu.add_command(label='Generate Channels')
config_menu.add_command(label='Download ScanLists to Devices')
# add the menu to the menubar
menubar.add_cascade(
label="Configurations",
menu=config_menu,
underline=0
)

root.mainloop()