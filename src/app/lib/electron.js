const { remote, shell, ipcRenderer  }  = require('electron'),
      { Menu, MenuItem } = remote,
        paths = remote.getGlobal('paths'),
        fs  = require('fs-extra'),
        path  = require('path'),
        request  = require('request');

var electron = {
    window: remote.getCurrentWindow(),
    pos: {x: 0, y: 0},
    init(options) {
        var self = this;

        document.getElementById(options.buttons.close).addEventListener("click", (e) => {
            e.preventDefault();
            self.close()
        });

        document.getElementById(options.buttons.minimize).addEventListener("click", (e) => {
            e.preventDefault();
            self.minimize()
        });

        if (process.env.NODE_ENV == 'development') {

            self.context = new Menu();

            document.addEventListener("contextmenu", (e) => {
                e.preventDefault();
                self.pos = {x: e.pageX, y: e.pageY};
                self.context.popup(self.window);
            });

            self.context.append(new MenuItem(
                {
                    label: 'Inspect Element',
                    click(){
                        self.inspect(self.pos.x, self.pos.y);
                    }
                }
            ));

            self.context.append(new MenuItem(
                {
                    label: 'Toggle DevTools',
                    click(){
                        self.window.toggleDevTools();
                    }
                }
            ));
        }
    },
    maximise(){
        var self = this;
        if (!self.window.isMaximized()) {
            self.window.maximize();
        } else {
            self.window.unmaximize();
        }
    },
    minimize(){
        this.window.minimize();
    },
    close(){
        this.window.close();
    },
    tools(){
        this.window.toggleDevTools();
    },
    inspect(x, y){
        this.window.inspectElement(x, y);
    },
    openURL(url){
        shell.openExternal(url);
    },
    reinstall(){
        ipcRenderer.send( 'reinstall', null );
    },
    log( log ){
        ipcRenderer.send( 'log', log );
    },
    err( err ){
        ipcRenderer.send( 'err', err );
    },
    getOpts( callback ){
        request('https://cdn.rawgit.com/digipixel-io/elysium-launcher/master/front/settings.json', function (error, response, body) {
            if (!error && response.statusCode == 200) {
                let obj = JSON.parse(body);
                fs.writeFile( path.join( paths.home, 'settings.json' ), body, (err)=> {
                    if (err) {
                        callback( err, null );
                    }else{
                        callback( null, obj );
                    }
                });
            } else {
                fs.access(path.join(paths.home, 'settings.json'), fs.F_OK, (err) => {
                    if (!err) {
                        fs.readFile(path.join(paths.home, 'settings.json'), 'utf8', function (err, data) {
                            if (err) {
                                callback(err, null);
                            } else {
                                callback(null, JSON.parse(data));
                            }
                        });
                    } else {
                        callback('Request failed and file does not exist.', null);
                    }
                });
            }
        });
    },
    webview( url ){
        $('.webview-wrapper').html(`<webview id="webview" style="display:none;" src="${url}"></webview>`);
        $('#webview').fadeIn(1000);
        let webview = document.getElementById('webview');
        webview.addEventListener('new-window', (e) => {
            const protocol = require('url').parse(e.url).protocol;
            if (protocol === 'http:' || protocol === 'https:') {
                shell.openExternal(e.url)
            }
        });
        webview.addEventListener('did-fail-load', () => {
            $('#webview').fadeOut(1000, () => {
                $('.connect-err').fadeIn(1000);
            });
        });
    }
};

module.exports = electron;