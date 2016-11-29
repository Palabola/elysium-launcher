const EventEmitter  = require('events').EventEmitter,
      WebTorrent    = require('webtorrent'),
      spawn         = require('child_process').spawn,
      moment        = require('moment'),
      path          = require('path'),
      fs            = require('fs-extra'),
      checksum      = require('checksum'),
      util          = require('util');

const status = {
    idle: 0,
    downloading: 1,
    installing: 2,
    paused: 3,
    done: 4
};

const s_status = [
    'idle',
    'downloading',
    'installing',
    'paused',
    'done'
];

const Installer = function ( opts, electron ) {

    EventEmitter.call(this);

    let self = this;

    self._uri = opts.uri;
    self._paths = opts.paths;
    self._realmlist = opts.realmlist;
    self._file = opts.file;
    self._checksum = opts.checksum;
    self._status = 0;

    let rar = path.join(self._paths.download, self._file);
    let cache = path.join(self._paths.extract, "World of Warcraft 1.12");
    let ver = "1.12";

    function format(num) {

        var exponent, unit, neg = num < 0, units = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        if (neg) num = -num;
        if (num < 1) return (neg ? '-' : '') + num + ' B';
        exponent = Math.min(Math.floor(Math.log(num) / Math.log(1000)), units.length - 1);
        num = Number((num / Math.pow(1000, exponent)).toFixed(2));
        unit = units[exponent];
        return (neg ? '-' : '') + num + ' ' + unit;

    }

    function install(){

        self.emit('in-progress', `Started installing World of Warcraft ${ver}`);
        self._setStatus(status.installing);
        electron.log(`Started installing World of Warcraft ${ver}`);

        let _7z = (  process.env.NODE_ENV != 'development' ) ? path.join( self._paths.app, 'node_modules/win-7zip/7zip-lite/7z.exe').replace('app.asar', 'app.asar.unpacked' ) : require('win-7zip')['7z']

        let extract = spawn(_7z, ['x', rar, '-y', '-o' + self._paths.extract]);

        self.emit('in-progress', `Extracting ${self._file}`);
        electron.log( `Extracting ${self._file}`);

        extract.stdout.on('data', (data) => {
            electron.log( `${data}` );
        });

        extract.stderr.on('data', (data) => {
            electron.err( `${data}` );
        });

        extract.on('exit', () => {

            self.emit('in-progress', `Installing World of Warcraft ${ver}`);
            electron.log( `Installing World of Warcraft ${ver}`);

            fs.move( cache, self._paths.install, {clobber: true}, (err) => {
                if (err) { electron.err( err ); }
                self.emit('in-progress', `Setting realmlist`);
                electron.log( `Setting realmlist to  ${self._realmlist}` );

                fs.writeFile(path.join(self._paths.install, "realmlist.wtf"), `set realmlist ${self._realmlist}`, (err)=> {
                    if (err) { electron.err( err ); }
                    electron.log( `Install Done.`);
                    self._setStatus(status.done);
                    self.emit('done');
                });
            });
        });
    }

    function download(){

        self.client = new WebTorrent();
        self.client.add(self._uri, {path: self._paths.download}, function (torrent) {

            self.torrent = torrent;

            self._setStatus(status.downloading);
            electron.log(`Downloading World of Warcraft ${ver}`);

            self.interval = setInterval(function () {

                let remaining = 'Done.';
                if (!torrent.done) {
                    remaining = moment.duration(torrent.timeRemaining / 1000, 'seconds').humanize();
                    remaining = remaining[0].toUpperCase() + remaining.substring(1) + ' remaining.';
                }

                self.emit('dl-progress', {
                    peers: torrent.numPeers + (torrent.numPeers === 1 ? ' peer' : ' peers'),
                    percent: Math.round(torrent.progress * 100 * 100) / 100,
                    downloaded: format(torrent.downloaded),
                    length: format(torrent.length),
                    remaining: remaining,
                    ratio: torrent.ratio,
                    speed: {
                        download: format(torrent.downloadSpeed) + '/s',
                        upload: format(torrent.uploadSpeed) + '/s'
                    }
                });
            }, 500);

            torrent.on('done', () => {
                clearInterval(self.interval);
                self.client.remove(torrent, (err) => {
                    if (err) { electron.err( err ); }
                    check( true );
                });
            })
        });
    }

    function check( remove_rar ){
        self.emit('in-progress', `Calculating checksum.`);
        checksum.file( rar, function ( err, sum ) {
            if (err) { electron.err( err ); }
            electron.log( `File checksum: ${sum}` );
            if ( sum === self._checksum ) {
                install();
            }else{
                if( remove_rar ){
                    fs.unlink('rar',function(err){
                        if (err) { electron.err( err ); }
                        download();
                    });
                }else{
                    download();
                }
            }
        });
    }

    fs.access( rar, fs.F_OK, (err) => {
        if (!err) {
            check();
        }else{
            download();
        }
    });
};

util.inherits( Installer, EventEmitter );

Object.assign( Installer.prototype, {
    _setStatus(status){
        let self = this;
        if (self._status != status) {
            self._status = status;
            self.emit('status', self.status());
        }
        return self._status;
    },
    paused(){
        let self = this;
        return ( self._status == status.paused );
    },
    pause(){
        let self = this;
        if (self._status != status.paused && self._status != status.idle) {
            self.torrent.pause();
            self._setStatus(status.paused);
            return true;
        } else {
            return false;
        }
    },
    resume(){
        let self = this;
        if (self._status == status.paused && self._status != status.idle) {
            self.torrent.resume();
            self._setStatus(status.downloading);
            return true;
        } else {
            return false;
        }
    },
    status(){
        let self = this;
        return s_status[self._status];
    }
});


module.exports = Installer;