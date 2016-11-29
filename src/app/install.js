const electron = require('./lib/electron.js'),
      Install  = require('./lib/installer.js'),
      remote   = require('electron').remote,
      path     = require('path'),
      cp       = require('child_process'),
      fs       = require('fs-extra'),
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

    let installer = new Install({
        paths: {
            download: paths.download,
            extract: paths.cache,
            install: paths.game,
            app: paths.app
        },
        file: "World of Warcraft 1.12 Client.rar",
        checksum: '3a4b4d12e02e08b3ee4686fa56e8b2c3855e7001',
        realmlist: "logon.elysium-project.org",
        uri: "magnet:?xt=urn:btih:2b32e64f6cd755a9e54d60e205a9681d6670cfae&dn=World+of+Warcraft+Client+-+Version+1.12.1+enUS+-+Windows&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Fzer0day.ch%3A1337&tr=udp%3A%2F%2Fopen.demonii.com%3A1337&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Fexodus.desync.com%3A6969",
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