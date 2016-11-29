const electron = require('./lib/electron.js'),
      remote   = require('electron').remote,
      path     = require('path'),
      cp       = require('child_process'),
      fs       = require('fs-extra'),
      paths    = remote.getGlobal('paths');

window.$ = window.jQuery = require('jquery');

$(function () {
    electron.init({
        buttons: {
            close: 'close',
            minimize: 'min'
        }
    });

    $('.play').click(() => {
        var child = cp.spawn(paths.wow, [], {detached: true, stdio: 'ignore'});
        child.unref();
        electron.close();
    });

    $('.btn-1').click(() => {
        $('.options-wrapper').fadeIn(500);
    });

    $('.close-opts').click(() => {
        $('.options-wrapper').fadeOut(100);
    });

    let cache_cleared = false;
    let cache_btn = $('.clear-cache');
    cache_btn.click(() => {
        if (!cache_cleared) {
            cache_btn.html('<div class="loader"><div class="line-scale-party"><div></div><div></div><div></div><div></div></div></div>');
            fs.access(path.join(paths.game, 'Cache'), fs.F_OK, (err) => {
                if (!err) {
                    fs.emptyDir(path.join(paths.game, 'Cache'), (err) => {
                        if (err) {
                            electron.err( err );
                        }
                        cache_btn.html('Done.');
                        cache_btn.addClass('disable');
                        cache_cleared = true;
                    })
                } else {
                    cache_btn.addClass('disable');
                    cache_btn.html('Done.');
                    cache_cleared = true;
                }
            });
        }
    });

    let wtf_cleared = false;
    let wtf_btn = $('.clear-wtf');
    wtf_btn.click(() => {
        if (!wtf_cleared) {
            wtf_btn.html('<div class="loader"><div class="line-scale-party"><div></div><div></div><div></div><div></div></div></div>');
            fs.access(path.join(paths.game, 'WTF'), fs.F_OK, (err) => {
                if (!err) {
                    fs.emptyDir(path.join(paths.game, 'WTF'), (err) => {
                        if (err) {
                            electron.err( err );
                        }
                        wtf_btn.html('Done.');
                        wtf_btn.addClass('disable');
                        wtf_cleared = true;
                    })
                } else {
                    wtf_btn.addClass('disable');
                    wtf_btn.html('Done.');
                    wtf_cleared = true;
                }
            });
        }

    });

    $('.open-install').click(() => {
        cp.exec(`start "" "${paths.game}"`);
    });

    $('.open-addons').click(() => {
        cp.exec(`start "" "${path.join(paths.game, 'Interface', 'AddOns')}"`);
    });

    $('.btn-2').click(() => {
        electron.openURL('https://elysium-project.org/');
    });

    $('.btn-3').click(() => {
        electron.openURL('https://forum.elysium-project.org/');
    });
});