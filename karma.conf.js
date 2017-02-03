// karma.conf.js
module.exports = function(config) {
  config.set({
    frameworks: ['mocha', 'chai', 'sinon'],

    files: [
      'src/!(index|amplitude-snippet).js',
      'test/base64.js',
      'test/language.js',
      'test/md5.js',
      'test/uuid.js',
      'test/cookie.js',
      'test/ua-parser.js',
      'test/identify.js',
      'test/cookiestorage.js',
      'test/utm.js',
      'test/amplitude.js',
      'test/amplitude-client.js',
      'test/utils.js',
      'test/revenue.js',
    ],

    browsers: ['PhantomJS'], //, 'Chrome'],

    // you can define custom flags
    customLaunchers: {
      'PhantomJS_custom': {
        base: 'PhantomJS',
        options: {
          windowName: 'my-window',
          settings: {
            webSecurityEnabled: false
          },
        },
        flags: ['--load-images=true'],
        debug: true
      }
    },

    preprocessors: {
      'test/*.js': ['webpack', 'sourcemap'],
      'src/*.js': ['webpack', 'sourcemap']
    },

    client: {
      mocha: {
        // change Karma's debug.html to the mocha web reporter
        reporter: 'html',
        ui: 'bdd'
      }
    },
    logLevel: config.LOG_INFO,

    webpack: {
      devtool: 'inline-source-map'
    },

    webpackMiddleware: {
      stats: 'errors-only'
    }

  });
};