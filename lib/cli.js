var CLI     = require('cli');
var Output  = require('./output');
var Step    = require('step');
var Github  = require('./github');
var Npm     = require('./npm');
var log     = require('./log');
var FS      = require('fs');
var Util    = require('./util');

CLI.setUsage('changelog <npm module name> [release] [options]\n' +
    '  changelog <github repo url> [release] [options]\n' +
    '\n' +
    'Release:\n' +
    '   latest   Show only the latest release.        ie: changelog express latest\n' +
    '   number   Show that many recent releases.      ie: changelog express 3 \n' +
    '   n.n.n    Show changes for a specific release. ie: changelog express 2.4.4'

).parse({
    color:      ['c', 'Output as Color (terminal default)'],
    markdown:   ['m', 'Output as Github-flavored Markdown (file default)'],
    json:       ['j', 'Output as JSON'],
    debug:      ['d', 'Enable debugging']
});

CLI.main(function (args, options) {
    log.debugEnabled(options.debug);

    var project = args[0];

    var releaseRequested = args[1];

    if (!project) {
        try {
            log.debug('Project not specified.  Looking for a package.json in ' + process.cwd() + ' instead.');
            project = JSON.parse(FS.readFileSync(process.cwd() + '/package.json').toString()).name;
        } catch (e) {
            log.debug('Package.json not found');
        }
    }

    var output = options.json ? Output.json : options.markdown ? Output.markdown : Util.enableColor() ? Output.color : Output.markdown;


    Step(
        function() {
            if (!project) {
                throw new Error('Need help? --help or more help at https://github.com/dylang/changelog');
            } else {
                if (project.match(/github.com/)) {
                    var repo = project.match(/github\.com\/([^\/]*\/[^\/]*)/);
                    if (repo && repo[1]) {
                        repo = repo[1].replace(/\.git$/, '');
                        Github.changelog(repo, releaseRequested, this);
                    } else {
                        throw new Error('Bad repo url: ' + project);
                    }
                } else {
                     Npm.changelog(project, releaseRequested, this);
                }
            }
        },
        function(err, data) {
            if (err) { throw err; }
            output(data, this);
        },
        function(err, data) {
            if (err) {
                log.error(err.message);
            }
            else {
                console.info(data);
            }
        }
    );
});



