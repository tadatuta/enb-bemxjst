var vow = require('vow'),
    fs = require('enb/lib/fs/async-fs'),
    bemxjst = require('bem-xjst'),
    BemxjstProcessor = require('sibling').declare({
        process: function (source, options) {
            return bemxjst.generate(source, options);
        }
    });

module.exports = require('enb/lib/build-flow').create()
    .name('bem-xjst')
    .target('target', '?.bem-xjst.js')
    .methods({
        _sourceFilesProcess: function (sourceFiles) {
            return vow.all(sourceFiles.map(function (file) {
                    return fs.read(file.fullname, 'utf8')
                        .then(function (source) {
                            return '/* begin: ' + file.fullname + ' *' + '/\n' +
                                source +
                                '\n/* end: ' + file.fullname + ' *' + '/';
                        });
                }))
                .then(function (sources) {
                    return this._bemxjstProcess(sources.join('\n'));
                }, this);
        },
        _bemxjstProcess: function (source) {
            var bemxjstProcessor = BemxjstProcessor.fork();

            return bemxjstProcessor.process(source, {
                    wrap: true,
                    exportName: this._exportName,
                    modulesDeps: this._modulesDeps,
                    naming: this._naming
                })
                .then(function (res) {
                    bemxjstProcessor.dispose();
                    return res;
                });
        }
    })
    .createTech();
