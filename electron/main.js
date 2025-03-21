// Modules to control application life and create native browser window
const { app, BrowserWindow, Menu, ipcMain, screen, shell } = require('electron')
const settings = require('electron-settings')
const ejse = require('./node/ejs-electron')
// const ejse = require('ejs-electron')
const path = require('node:path')

const prod = process.env.NODE_ENV == 'production';
const root = app.isPackaged ? path.join('resources', 'app.asar') : '';

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

app.setName('Meme Editor');

// this should be placed at top of main.js to handle setup events quickly
if (handleSquirrelEvent()) {
	// squirrel event handled and app will exit in 1000ms, so don't do anything else
	return;
}
  
  function handleSquirrelEvent() {
	if (process.argv.length === 1) {
	  return false;
	}
  
	const ChildProcess = require('child_process');
	const path = require('path');
  
	const appFolder = path.resolve(process.execPath, '..');
	const rootAtomFolder = path.resolve(appFolder, '..');
	const updateDotExe = path.resolve(path.join(rootAtomFolder, 'Update.exe'));
	const exeName = path.basename(process.execPath);
  
	const spawn = function(command, args) {
	  let spawnedProcess, error;
  
	  try {
		spawnedProcess = ChildProcess.spawn(command, args, {detached: true});
	  } catch (error) {}
  
	  return spawnedProcess;
	};
  
	const spawnUpdate = function(args) {
	  return spawn(updateDotExe, args);
	};
  
	const squirrelEvent = process.argv[1];
	switch (squirrelEvent) {
	  case '--squirrel-install':
	  case '--squirrel-updated':
		// Optionally do things such as:
		// - Add your .exe to the PATH
		// - Write to the registry for things like file associations and
		//   explorer context menus
  
		// Install desktop and start menu shortcuts
		spawnUpdate(['--createShortcut', exeName]);
  
		setTimeout(app.quit, 1000);
		return true;
  
	  case '--squirrel-uninstall':
		// Undo anything you did in the --squirrel-install and
		// --squirrel-updated handlers
  
		// Remove desktop and start menu shortcuts
		spawnUpdate(['--removeShortcut', exeName]);
  
		setTimeout(app.quit, 1000);
		return true;
  
	  case '--squirrel-obsolete':
		// This is called on the outgoing version of your app before
		// we update to the new version - it's the opposite of
		// --squirrel-updated
  
		app.quit();
		return true;
	}
};

// run this as early in the main process as possible
if (require('electron-squirrel-startup')) app.quit();

var win;

var kViewsPath = path.resolve('views');
var kPublicPath = path.resolve('public');
var kEntryPoint = 'app.ejs';
var kRootDir = path.join(__dirname, '..');

// console.log('NODE Environment:', process.env.NODE_ENV);
// console.log('ELECTRON Environment:', process.env.ELECTRON_ENV);
// console.log('APP is packaged:', app.isPackaged);

if (app.isPackaged) {
	kViewsPath = path.resolve(root, 'views');
	kPublicPath = path.join(root, 'public');

	kEntryPoint = '/app.prod.ejs';
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
	app.quit();
	return;
}

app.on('second-instance', (event, commandLine, workingDirectory) => {
	// Someone tried to run a second instance, we should focus our window.
	if (win) {
		if (win.isMinimized()) 
			win.restore()

		win.focus()
	}
})

async function createWindow () {

	// if (app.isPackaged)
	// 	Menu.setApplicationMenu(null);

	const icon = path.resolve(root, 'public', 'ui', 'png', 'app-icon.png');

	// console.log('ICON', icon);
	
	const stateKeeper = await windowStateKeeper('main');

	// Create the browser window.
	const mainWindow = new BrowserWindow({
		title: 'Meme Editor',
		x: stateKeeper.x < 0 ? 0 : stateKeeper.x,
		y: stateKeeper.y < 0 ? 0 : stateKeeper.y,
		width: stateKeeper.width,
		height: stateKeeper.height,
		frame: false,
		icon,
		// resizable: false,
		// transparent: false,
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
			nodeIntegration: true,
			contextIsolation: false,
			webSecurity: false
		}
	})

	mainWindow.webContents.setWindowOpenHandler(({ url }) => {
		// config.fileProtocol is my custom file protocol
		if (url.startsWith('file')) {
			return { action: 'allow' };
		}
		// open url in a browser and prevent default
		shell.openExternal(url);
		return { action: 'deny' };
	});

	stateKeeper.track(mainWindow);

	// ejse.data('username', 'Some Guy')

	ejse.options('ejs', kViewsPath);
	ejse.options('public', kPublicPath);
	ejse.options('root', kRootDir);

	ejse.data('platform', process.platform);

	// and load the index.html of the app.
	// mainWindow.loadFile('index.html')
	mainWindow.loadFile(kEntryPoint)

	// mainWindow.loadURL('file://' + entrypoint)
	// mainWindow.loadURL('file:///app.ejs')

	// Open the DevTools.
	// mainWindow.webContents.openDevTools()

	win = mainWindow;
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {

	// session.defaultSession.protocol.registerFileProtocol('static', (request, callback) => {

	//   console.log(request);

	//   const fileUrl = request.url.replace('static://', '');
	//   const filePath = path.join(app.getAppPath(), '.webpack/renderer', fileUrl);
	//   callback(filePath);
	// });

	// protocol.interceptFileProtocol('file', (request, callback) => {
	//   const url = request.url.substr(7)    /* all urls start with 'file://' */
	//   callback({ path: path.normalize(`${__dirname}/${url}`) })
	// }, (err) => {
	//   if (err) console.error('Failed to register protocol')
	// })

	createWindow()

	app.on('activate', function () {
		// On macOS it's common to re-create a window in the app when the
		// dock icon is clicked and there are no other windows open.
		if (BrowserWindow.getAllWindows().length === 0) createWindow()
	})
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
	if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

ipcMain.on('close', () => {
	// console.log('ON close');
	app.quit()
})

async function windowStateKeeper(windowName) {
	let window, windowState;

	const setBounds = async () => {
		// Restore from appConfig
		if (await settings.has(`windowState.${windowName}`)) {
			windowState = await settings.get(`windowState.${windowName}`);
			return;
		}

		const size = screen.getPrimaryDisplay().workAreaSize;

		// Default
		windowState = {
			x: undefined,
			y: undefined,
			width: size.width / 2,
			height: size.height / 2,
		};
	};

	const saveState = async () => {
		// bug: lots of save state events are called. they should be debounced
		if (!windowState.isMaximized) {
			windowState = window.getBounds();
		}
		windowState.isMaximized = window.isMaximized();
		await settings.set(`windowState.${windowName}`, windowState);
	};

	const track = async (win) => {
		window = win;
		['resize', 'move', 'close'].forEach((event) => {
			win.on(event, saveState);
		});
	};

	await setBounds();

	return {
		x: windowState.x,
		y: windowState.y,
		width: windowState.width,
		height: windowState.height,
		isMaximized: windowState.isMaximized,
		track,
	};
};
