const { remote, shell, ipcRenderer  }  = require('electron'),
      { Menu, MenuItem } = remote;


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
    log( log ){
        ipcRenderer.send( 'log', log );
    },
    err( err ){
        ipcRenderer.send( 'err', err );
    }
};

module.exports = electron;