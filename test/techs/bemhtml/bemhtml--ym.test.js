var fs = require('fs'),
    path = require('path'),
    mock = require('mock-fs'),
    MockNode = require('mock-enb/lib/mock-node'),
    FileList = require('enb/lib/file-list'),
    Tech = require('../../../techs/bemhtml'),
    bemhtmlCoreFilename = path.join(__dirname, '..', '..', 'fixtures', 'i-bem.bemhtml'),
    htmlFilename = path.join(__dirname, '..', '..', 'fixtures', 'bemhtml', 'browser--ym.html'),
    mochaFilename = require.resolve('mocha/mocha.js'),
    chaiFilename = require.resolve('chai/chai.js'),
    ymFilename = require.resolve('ym/modules.js'),
    runServer = require('../../lib/run-server');

describe('bemhtml --browser --ym', function () {
    afterEach(function () {
        mock.restore();
    });

    it('compiled files should works on client-side', function () {
        var test = generateTest('<a class="bla"></a>');

        return runTest(test);
    });

    it('must build block with custom exportName', function () {
        var test = generateTest('<a class="bla"></a>', 'BH'),
            options = { exportName: 'BH' };

        return runTest(test, options);
    });

    it('modulesDeps', function () {
        var test = generateTest('<div class="bla">^_^</div>'),
            options = {
                modulesDeps: { A: 'A' }
            },
            template = 'block("bla").content()(function(){ return A })',
            lib = 'modules.define("A", function (provide) { provide("^_^"); });';

        return runTest(test, options, template, lib);
    });
});

function runTest(testContent, options, template, lib) {
    var bundle,
        fileList,

        scheme = {
            blocks: {
                'base.bemhtml': fs.readFileSync(bemhtmlCoreFilename, 'utf-8'),
                'bla.bemhtml': template || 'block("bla").tag()("a")'
            },
            bundle: {},
            'index.html': fs.readFileSync(htmlFilename, 'utf-8'),
            'test.js': testContent,
            'mocha.js': fs.readFileSync(mochaFilename, 'utf-8'),
            'chai.js': fs.readFileSync(chaiFilename, 'utf-8'),
            'ym.js': fs.readFileSync(ymFilename, 'utf-8'),
            'some-ym-lib.js': lib || ''
        };

    mock(scheme);

    bundle = new MockNode('bundle');
    fileList = new FileList();
    fileList.loadFromDirSync('blocks');
    bundle.provideTechData('?.files', fileList);

    return bundle.runTech(Tech, options)
        .then(function () {
            return runServer(3000);
        });
}

function generateTest(expected, exportName) {
    expected = expected.replace(/'/g, '\\\'');
    exportName = exportName || 'BEMHTML';

    return [
        'chai.should();',
        'it("autogenerated test", function (done) {',
            'modules.require("' + exportName + '", function (' + exportName + ') {',
                exportName + '.apply({ block: "bla" }).should.equal(\'' + expected + '\');',
                'done();',
            '});',
        '});'
    ].join('\n');
}
