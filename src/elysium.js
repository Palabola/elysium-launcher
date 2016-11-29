const { ipcMain , app, BrowserWindow } = require('electron'),
      url      = require('url'),
      fs       = require('fs-extra'),
      path     = require('path'),
      winston  = require('winston'),
      windows  = {};

global.paths = {
    base: path.join(__dirname),
    app: app.getAppPath(),
    home: path.join(process.env.APPDATA, '.elysium'),
    download: path.join(process.env.APPDATA, '.elysium', 'download'),
    game: path.join(process.env.APPDATA, '.elysium', 'game'),
    cache: path.join(process.env.APPDATA, '.elysium', 'cache'),
    logs: path.join(process.env.APPDATA, '.elysium', 'logs'),
    wow: path.join(process.env.APPDATA, '.elysium', 'game', 'WoW.exe')
};

const formatter = (options) => {
    return `[${new Date().toISOString()}] ${options.level.toUpperCase()}: ${(options.message ? options.message : '')} ${(options.meta && Object.keys(options.meta).length ? '\n\t' + JSON.stringify(options.meta) : '' ) }`;
};

const logger = new ( winston.Logger )({
    transports: [
        new winston.transports.Console({}),
        new winston.transports.File({
            name: 'elysium-log',
            filename: path.join( paths.logs, 'log.log' ),
            json: false,
            formatter: formatter
        })
    ]
});

// enable experimental css
app.commandLine.appendSwitch('--enable-experimental-web-platform-features');


function Window( w, h, html, callback){

    windows.main = new BrowserWindow({
        width: w,
        height: h,
        transparent: true,
        frame: false,
        show: false,
        resizable: false,
        maximizable: false
    });

    windows.main.loadURL(url.format({
        pathname: path.join(__dirname, 'app', html ),
        protocol: 'file:',
        slashes: true
    }));

    windows.main.once('ready-to-show', () => {
        windows.main.show();
        windows.main.focus();
        if (process.env.NODE_ENV == 'development') {
            windows.main.webContents.openDevTools();
        }
        callback();
    });

    windows.main.on('closed', () => {
        windows.main = null
    });
}

app.on('ready', () => {

    fs.ensureDir(paths.download, (err) => {
        if (err) {
            logger.log('error', err);
        }
        fs.ensureDir(paths.game, (err) => {
            if (err) {
                logger.log('error', err);
            }
            fs.ensureDir(paths.cache, (err) => {
                if (err) {
                    logger.log('error', err);
                }
                fs.ensureDir(paths.logs, (err) => {
                    if (err) {
                        logger.log('error', err);
                    }
                    fs.access(paths.wow, fs.F_OK, (err) => {
                        if (!err) {
                            //wow.exe not missing
                            Window( 646, 513, 'index.html', () => {});
                        } else {
                            //wow.exe missing, run installer
                            Window( 646, 543, 'install.html', () => {});
                        }
                    });
                });
            });
        });
    });
});

let reinstall = false;
app.on('window-all-closed', () => {
    if ( reinstall != true ) {
        app.quit()
    }
});

ipcMain.on('log', (event, arg) => {
    console.log(arg);
    logger.log('info', arg);
});

ipcMain.on('err', (event, arg) => {
    console.log(arg);
    logger.log('error', arg);
});

ipcMain.on('reinstall', ( event, arg ) => {
    reinstall = true;
    windows.main.close();
    windows.main = null;
    Window( 646, 543, 'install.html', () => {
        reinstall = false;
    });
});