const electron = require('./lib/electron.js'),
      Install  = require('./lib/installer.js'),
      remote   = require('electron').remote,
      path     = require('path'),
      cp       = require('child_process'),
      fs       = require('fs-extra'),
      request  = require('request'),
      paths    = remote.getGlobal('paths');

window.$ = window.jQuery = require('jquery');

$(() => {

    electron.init({
        buttons: {
            close: 'close',
            minimize: 'min'
        }
    });

    let play = $('.play');
    let bar = $('.bar');
    let download_status = $('.download-status');
    let download_wrapper = $('.download-wrapper');
    let install_wrapper = $('.install-wrapper');
    let install_msg = $('.install-msg');
    let installed_wrapper = $('.installed-wrapper');


    electron.getOpts(( err, opts )=>{
        if ( !err ) {

            electron.webview( opts.webview );

            let installer = new Install({
                paths: {
                    download: paths.download,
                    extract: paths.cache,
                    install: paths.game,
                    app: paths.app
                },
                file: opts.install.file,
                checksum: opts.install.checksum,
                realmlist: opts.install.realmlist,
                ver: opts.install.ver,
                uri: opts.install.uri
            }, electron );

            installer.on('dl-progress', (data) => {
                download_status.html(`Downloading: ${data.downloaded} / ${data.length} @ ${data.speed.download} <br> ${data.remaining}`);
                bar.html(`${data.percent}%<div class="end">`);
                bar.css({
                    background: () => {
                        return `hsl( ${data.percent}, 100%, 40% )`
                    },
                    width: () => {
                        return `${data.percent}%`
                    }
                });
            });

            installer.on('in-progress', (msg) => {
                install_msg.html(`<span>${msg}</span>`);
            });

            installer.on('status', (status) => {

                switch (status) {
                    case 'idle':
                        break;
                    case 'downloading':
                        install_wrapper.fadeOut(250);
                        download_wrapper.fadeIn(250);
                        break;
                    case 'installing':
                        download_wrapper.fadeOut(250);
                        install_wrapper.fadeIn(250);
                        break;
                    case 'paused':
                        break;
                    case 'done':
                        install_wrapper.fadeOut(250);
                        installed_wrapper.html('<h1>World of Warcraft v1.12 Installed!</h1>');
                        installed_wrapper.fadeIn(250);
                        play.removeClass('disable');
                        break;
                }
                download_status.html(status);
            });

        }else{
            $('.connect-err').fadeIn(1000);
            install_msg.html(`<span>Unable to get settings.json</span>`);
            electron.err(err);
        }
    });

    play.click(() => {
        if( !play.hasClass( "disable" ) ){
            var child = cp.spawn( paths.wow, [], {detached: true, stdio: 'ignore'} );
            child.unref();
            electron.close();
        }
    });

    $('.btn-1').click(() => {
        $('.options-wrapper').fadeIn(500);
    });

    $('.close-opts').click(() => {
        $('.options-wrapper').fadeOut(100);
    });

    $('.btn-2').click(() => {
        electron.openURL('https://elysium-project.org/');
    });

    $('.btn-3').click(() => {
        electron.openURL('https://forum.elysium-project.org/');
    });
});