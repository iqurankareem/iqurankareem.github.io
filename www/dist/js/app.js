'use strict';

// Declare app level module which depends on views, and components
angular.module('iQuran', [
  'ngRoute',
  'ngMdIcons',
  'module.quran'
])
.constant('appConfig',
  {
    name:     'iQuran Kareem',
    desc:     'Read the Quran in arabic alongside its translation, with three reading modes.',
    version:  '0.2.14',
    versionCode: 21,
    organization: 'Utmostphere',
    url: 'http://iqurankareem.com',
    package:  "com.iqurankareem",
    // Change the environment as your needs
    environment: 'production', // production, staging, testing, development
    TAG: 'iQuran Kareem >> ',
    db: {
      name:     'iquran.db',
      version:  2,
      scheme:   '0.0.2',
      logs:    [{1: '0.0.1'}, {2: '0.0.2'}],
      schemes: {
        '0.0.1': [
          'CREATE TABLE IF NOT EXISTS type       (id INTEGER PRIMARY KEY, type TEXT, status INTEGER)',
          'CREATE TABLE IF NOT EXISTS trans      (id INTEGER PRIMARY KEY, trans TEXT, status INTEGER)'
        ],
        '0.0.2': [
          'CREATE TABLE IF NOT EXISTS type       (id INTEGER PRIMARY KEY, type TEXT, status INTEGER)',
          'CREATE TABLE IF NOT EXISTS trans      (id INTEGER PRIMARY KEY, trans TEXT, status INTEGER)',

          // note_group: contain with 1-3,5,6,7,19
          // per aya could have more than one note
          'CREATE TABLE IF NOT EXISTS notes      (id INTEGER PRIMARY KEY, sura_name TEXT, sura INTEGER, aya INTEGER, aya_text TEXT, note_group TEXT, note TEXT, note_date TEXT)',

          'CREATE TABLE IF NOT EXISTS bookmarks  (id INTEGER PRIMARY KEY, sura_name TEXT, sura INTEGER, aya INTEGER, aya_text TEXT, bookmark_date TEXT)',
          'CREATE TABLE IF NOT EXISTS highlights (id INTEGER PRIMARY KEY, sura_name TEXT, sura INTEGER, aya INTEGER, aya_text TEXT, color TEXT, highlight_date TEXT)',

          // label_group: contain with 1-3,5,6,7,19
          // per aya could have more than one label
          'CREATE TABLE IF NOT EXISTS labels     (id INTEGER PRIMARY KEY, sura INTEGER, aya INTEGER, label_group TEXT, label TEXT)',

          // contains of label word by word
          'CREATE TABLE IF NOT EXISTS label_flags (id INTEGER PRIMARY KEY, label TEXT)'
        ]
      },
      collections: {
        // default value apllication
        // '0.0.1': {
        //  "INSERT INTO payer (user_id, name) VALUES (?,?)": [
        //    {param: [null, 'My Employer']},
        //    {param: [null, 'My Bank']},
        //    {param: [null, 'My Government']},
        //    {param: [null, 'My Pension']},
        //    {param: [null, 'NA']},
        //  ],
        //  "INSERT INTO expense_category (user_id, name) VALUES (?,?)": [
        //    {
        //      param: [null, 'Automobile'],
        //      children: {
        //        "INSERT INTO sub_category (expense_category_id, user_id, name) VALUES (?, ?, ?)": [
        //          {param: [null, 'AAA or Road Services']},
        //          {param: [null, 'Fuel']},
        //          {param: [null, 'Insurance']},
        //          {param: [null, 'Lease']},
        //          {param: [null, 'Maintenance']},
        //          {param: [null, 'Mileage']},
        //          {param: [null, 'Other']},
        //          {param: [null, 'Registration & Tax']}
        //        ]
        //      }
        //    },
        //    {
        //      param: [null, 'Entertainment'],
        //      children: {
        //        "INSERT INTO sub_category (expense_category_id, user_id, name) VALUES (?, ?, ?)": [
        //          {param: [null, 'Concert']},
        //          {param: [null, 'Movies']},
        //          {param: [null, 'Other']},
        //          {param: [null, 'Party']},
        //          {param: [null, 'Sports']}
        //        ]
        //      }
        //    }
        //  ]
        // }
      }
    },

    path: {
      production: 'http://kambeeng.github.io/quran',
      staging: null,
      testing: null,
      development: 'http://192.168.0.20/kambeeng/github/kambeeng.github.io/quran',
    },

    api: function(path, param) {
      var
      split = path.split('.'),
      res = this.uri;

      for (var i = 0; i < split.length; i++) {
        res = res[split[i]];
      }

      var
      uri = this.path[this.environment] + res;
      if(param) {
        return uri.concat('/', param);
      }
      return uri;
    },

    uri: {
      quran: {
        content:   '/content',
        manifest:   '/content/manifest.json'
      },
      trans: {
        content:   '/trans'
      }
    }
  })

.provider('appDb', function(appConfig) {

  this.db = null;
  this.openDb = function() {
    this.db = window.sqlitePlugin.openDatabase({name: appConfig.db.name, location: 1});
  };

  this.init = function(callback) {

    if(localStorage.getItem('db.built')) {
      if(callback) callback(null, {message: 'The database is built.', status: 0});
      return;
    }

    var
    that = this,
    db = appConfig.db,
    scheme = db.scheme,
    schemes = db.schemes[scheme];
    that.db.transaction(function(tx) {
      // execute db from user configuration
      for (var j = 0; j < schemes.length; j++) {
        tx.executeSql(schemes[j]);
      }
      if(callback) callback({message: 'Initialization database successful', status: 1});
      localStorage.setItem('db.built', true);
    });
  };

  this.query = function(sql, param, cb) {
    this.db.transaction(function(tx) {
      tx.executeSql(sql, param, function(tx, res) {
        if(cb) cb(res);
      }, function(e) {
        if(cb) cb(null, e);
      });
    });
  };

  this.$get = function() {
    return this;
  };
})

.config(['$routeProvider', '$sceDelegateProvider', function($routeProvider, $sceDelegateProvider) {

  $sceDelegateProvider.resourceUrlWhitelist([
    // Allow same origin resource loads.
    'self',
    // Allow loading from our assets domain.  Notice the difference between * and **.
    'http://iqurankareem.github.io/**'
  ]);

  $routeProvider.when('/', {redirectTo: '/quran'});
  // FIXME: move all configuration of quran module to quran's module, then create object extends configuration
  $routeProvider.when('/quran/:sura?/:aya?', {
    templateUrl: 'http://iqurankareem.github.io/www/app/module/quran/template/reader.html',
    controller: 'QuranController'
  });

  $routeProvider.when('/trans', {
    templateUrl: 'http://iqurankareem.github.io/www/app/module/quran/template/trans.html',
    controller: 'TransController'
  });

  $routeProvider.when('/note/detail/:id', {
    templateUrl: 'http://iqurankareem.github.io/www/app/module/quran/template/note-detail.html',
    controller: 'NoteDetailController'
  });

  $routeProvider.when('/note/list', {
    templateUrl: 'http://iqurankareem.github.io/www/app/module/quran/template/note-list.html',
    controller: 'NotelistController'
  });

  $routeProvider.when('/note', {
    templateUrl: 'http://iqurankareem.github.io/www/app/module/quran/template/note.html',
    controller: 'NoteController'
  });

  $routeProvider.when('/highlight', {
    templateUrl: 'http://iqurankareem.github.io/www/app/module/quran/template/highlight.html',
    controller: 'HighlightController'
  });

  $routeProvider.when('/highlight/list', {
    templateUrl: 'http://iqurankareem.github.io/www/app/module/quran/template/highlight-list.html',
    controller: 'HighlightListController'
  });

  $routeProvider.when('/bookmark', {
    templateUrl: 'http://iqurankareem.github.io/www/app/module/quran/template/bookmark.html',
    controller: 'BookmarkController'
  });

  $routeProvider.when('/bookmark/list', {
    templateUrl: 'http://iqurankareem.github.io/www/app/module/quran/template/bookmark-list.html',
    controller: 'BookmarklistController'
  });

  $routeProvider.when('/label', {
    templateUrl: 'http://iqurankareem.github.io/www/app/module/quran/template/label.html',
    controller: 'LabelController'
  });

  $routeProvider.when('/sura', {
    templateUrl: 'http://iqurankareem.github.io/www/app/module/quran/template/sura.html',
    controller: 'SuraController'
  });

  $routeProvider.when('/jiza', {
    templateUrl: 'http://iqurankareem.github.io/www/app/module/quran/template/jiza.html',
    controller: 'JuzController'
  });

  $routeProvider.otherwise({redirectTo: '/notfound'});

}])

.run(function(appConfig, appDb, downloaderService) {

  function onDeviceReady() {

    screen.lockOrientation('portrait');
    StatusBar.hide();
    appDb.openDb();

    if(localStorage.getItem('quran.db.scheme') !== appConfig.db.scheme) {
      // Initial database
      appDb.init();
      localStorage.setItem('quran.db.scheme', appConfig.db.scheme);
    }

    if(!localStorage.getItem('quran.download')) {
      downloaderService
        .download(
          appConfig.api('quran.content', 'simple.zip'),
          cordova.file.externalDataDirectory+'quran/simple.zip',
          'iQuran Content')
        .then(function(res) {
          localStorage.setItem('quran.download', true);
          var
          sql = "INSERT INTO type (type, status) VALUES (?,?)",
          param =  ["simple", 1];
          appDb.query(sql, param, function(res) {
            console.log(res);
          });
          localStorage.setItem('quran.type', 'simple');

          downloaderService
          .unzip(
            cordova.file.externalDataDirectory+'quran/simple.zip',
            cordova.file.externalDataDirectory +'quran',
            'iQuran Content')
          .then(function() {
            location.hash = "#/quran/1/1";
          });

        });
    }
  }

  document.addEventListener("deviceready", onDeviceReady, false);

});
(function(){
  'use strict';

  angular.module('iQuran')
         .service('downloaderService', ['$q', '$http', downloaderService]);

  function downloaderService($q, $http) {

    var download = function(uri, targetPath, msg) {

      var
      fileTransfer = new FileTransfer();
      uri = encodeURI(uri);
      return $q(function(resolve, reject) {
        navigator.notification.progressStart('Downloading', msg);
        fileTransfer.download(
            uri,
            targetPath,
            function(entry) {
                console.log("download complete: " + entry.toURL());
                navigator.notification.progressStop();
                resolve(entry);
            },
            function(error) {
                console.log("download error source " + error.source);
                console.log("download error target " + error.target);
                console.log("upload error code" + error.code);
            });

        fileTransfer.onprogress = function(progressEvent) {
            if (progressEvent.lengthComputable) {
              var val = Math.round((progressEvent.loaded / progressEvent.total) * 100);
              navigator.notification.progressValue(val);
            }
        };
      });

    };

    var unzip = function(fileName, targetPath, msg) {
      return $q(function(resolve, reject) {
        navigator.notification.activityStart('Extracting', msg);
        zip.unzip(
          fileName,
          targetPath,
          function() {
            navigator.notification.activityStop();
            resolve();
          });

      });
    };

    // Promise-based API
    return {
      download: download,
      unzip: unzip
    };
  }

})();
'use strict';

// Prepare the 'quran' module for subsequent registration of controllers and delegates
angular.module('module.quran', ['ngSanitize', 'ngRoute']);
(function(){

  angular
    .module('module.quran')
    .factory('ayaSelectedObject', function () {
      return {
        sura: 1,
        suraName: '',
        stacks: '',
        ayas: [] // 1 : alif laam mim
      };
    })
    .controller('QuranController', [
      '$scope', 'quranService', '$log', '$q', '$http', '$routeParams', '$window', '$location', 'ayaSelectedObject', 'appDb', 'downloaderService', 'appConfig',
      QuranController
    ])
    .controller('TransController', [
      '$scope', 'quranService', '$log', '$q', '$http', '$routeParams', '$window', '$location', 'appDb', 'downloaderService', 'appConfig',
      TransController
    ])
    .controller('SuraController', [
      '$scope', 'quranService', '$log', '$q', '$http', '$routeParams', '$window', '$location', 'appDb',
      SuraController
    ])
    .controller('JuzController', [
      '$scope', 'quranService', '$log', '$q', '$http', '$routeParams', '$window', '$location', 'appDb',
      JuzController
    ])
    .filter('parseArabicNumber', function() {
      return function(input) {
        var id= ['٠','١','٢','٣','٤','٥','٦','٧','۸','۹'];
        return input.replace(/[0-9]/g, function(w){
          return id[+w];
        });
      };
    })
    .filter('ayaSign', function() {
      return function(input) {
        return input.replace(/[ۖ|ۗ|ۛ|ۚ|ۙ|ۘ]/g, function(w){
          return ' <span class="sign">&nbsp;'+w+'</span> ';
        });
      };
    })
    .filter('suraType', function() {
      return function(input) {
        if(input == 'Meccan') return 'المكية';
        return 'المدينية';
      };
    });

  function QuranController($scope, quranService, $log, $q, $http, $routeParams, $window, $location, ayaSelectedObject, appDb , downloaderService, appConfig) {

    var
    self = $scope;
    self.sura = 1;
    self.aya = $routeParams.aya || '1';
    self.surasObj = []; // used as quran big object data response
    self.type = localStorage.getItem('quran.type') || 'simple';
    self.quranMode = localStorage.getItem('quran.mode') || 'arabic';
    self.quranTrans = localStorage.getItem('quran.trans') || null;

    self.showNotes = (localStorage.getItem('quran.showNotes'))? parseInt(localStorage.getItem('quran.showNotes')): 0;

    self.modes = [];
    self.optionMode = localStorage.getItem('quran.mode') || 'arabic';

    self.types = [];
    self.optionType = localStorage.getItem('quran.type') || 'simple';

    $('body').css('overflow', 'auto');

    self.lastAya = false;
    self.isLoading = false;
    self.suras = [];
    self.suraOptions = [];
    self.suraName = '';
    self.quran = '';
    self.besmShow = true;
    // self.floatingBtn = true;
    self.topNavbar = true;

    self.from = 1;
    self.limit = 25;
    self.to = self.limit + parseInt(self.aya);

    if(!$routeParams.sura) {
      var _sura = localStorage.getItem('quran.sura');
      var _aya = localStorage.getItem('quran.aya');
      if(_sura) {
        self.sura = parseInt(_sura);
        self.aya = parseInt(_aya);
      } else {
        localStorage.setItem('quran.sura', 1);
        localStorage.setItem('quran.aya', 1);
      }
    } else {
      self.sura = $routeParams.sura;
      self.aya = $routeParams.aya;
      localStorage.setItem('quran.sura', $routeParams.sura);
      localStorage.setItem('quran.aya', $routeParams.aya);
    }

    if(self.sura == 1 || self.sura == 9) {
      self.besmShow = false;
    }

    // Load all registered users
    self._sura = [];
    self._trans = [];
    self.deferredAborts = [];
    self.abortReq = function() {
      angular.forEach(self.deferredAborts, function (deferredAbort) {
        deferredAbort.promise.isGloballyCancelled = true;
        deferredAbort.resolve();
      });
      self.deferredAborts.length = 0;
    };


    // User's properties [bookmark|notes|highlight] belong to surah current opened
    self.props = {
      bookmarks: {},
      highlights: {},
      notes: {}
    };

    self.tables = ['bookmarks', 'highlights', 'notes'];

    self.fetchSurahProps = function(cb) {

      function fetchByTable(index) {
        if(!self.tables[index]){
          if(cb) cb();
          return;
        }

        var
        sql = "SELECT * FROM "+self.tables[index]+" WHERE sura = ?;",
        param = [self.sura];
        appDb.query(sql, param, function(res) {
          self.props[self.tables[index]].length = 0;
          if(res.rows.length) {
            for (var i = 0; i < res.rows.length; i++) {
              var
              item = res.rows.item(i);
              if(!self.props[self.tables[index]][item.sura+'.'+item.aya]){
                self.props[self.tables[index]][item.sura+'.'+item.aya] = [];
              }
              self.props[self.tables[index]][item.sura+'.'+item.aya].push(item);
            }
          }
          fetchByTable(++index);
        });
      }
      fetchByTable(0);
    };

    // Scroll spy
    self.scrollSpy = function() {
      if(self.aya == 1) return; // if aya is 1, do not scrolling
      var
      offsetTop = ($('#'+self.sura+'-'+self.aya).offset().top || 0)-70;
      $('html, body').stop().animate({
          scrollTop: offsetTop
      }, 600);
    };

    self.fetchAya = function(type, sura, aya, from, to) {
      if(aya >= from && aya <= to) {
        self.isLoading = true;

        var
        srv = null,
        deferredAbort = $q.defer();
        self.deferredAborts.push(deferredAbort);

        if(self.quranMode == 'arabic') {
          srv = quranService.getSura(type, sura, aya, deferredAbort);
        } else if(self.quranMode == 'trans') {
          if(!self.quranTrans) return; // TODO: it should alert an error
          srv = quranService.getTrans(self.quranTrans, sura, aya, deferredAbort);
        } else {
          var
          _sura = [];
          quranService.getSura(type, sura, aya, deferredAbort)
            .then( function( ayaObj ) {

              var
              _bookmark = self.props['bookmarks'][ayaObj.sura+'.'+ayaObj.aya] || false,
              _highlight = self.props['highlights'][ayaObj.sura+'.'+ayaObj.aya] || false,
              _note = self.props['notes'][ayaObj.sura+'.'+ayaObj.aya] || false;

              ayaObj.bookmarks = (_bookmark === false)? _bookmark: true;
              ayaObj.highlights = '';
              if(_highlight) {
                for (var i in _highlight) {
                  ayaObj.highlights = _highlight[i].color;
                }
              }

              // ayaObj.notes = (_note === false)? _note: true;
              ayaObj.notes = false;
              if(_note) {
                var
                _notesText = [];
                for (var i in _note) {
                  _notesText.push(_note[i].note);
                }
                ayaObj.notes = _notesText.join('<br/>');
              }

              self._sura.push(ayaObj);
              quranService.getTrans(self.quranTrans, sura, aya, deferredAbort)
                .then( function( transObj ) {
                  ayaObj.trans = transObj.text;
                  self.surasObj.push(ayaObj);
                  self.fetchAya(type, sura, ++aya, from, to);
                }, function(err) {
                  self.lastAya = true;
                  self.isLoading = false;
                  self.scrollSpy();
                });
            }, function(err) {
              self.lastAya = true;
              self.isLoading = false;
              self.scrollSpy();
            });
          return;
        }

        srv
        .then( function( ayaObj ) {

          var
          _bookmark = self.props['bookmarks'][ayaObj.sura+'.'+ayaObj.aya] || false,
          _highlight = self.props['highlights'][ayaObj.sura+'.'+ayaObj.aya] || false,
          _note = self.props['notes'][ayaObj.sura+'.'+ayaObj.aya] || false;

          ayaObj.bookmarks = (_bookmark === false)? _bookmark: true;
          ayaObj.highlights = '';
          if(_highlight) {
            for (var i in _highlight) {
              ayaObj.highlights = _highlight[i].color;
            }
          }
          // ayaObj.notes = (_note === false)? _note: true;
          ayaObj.notes = false;
          if(_note) {
            var
            _notesText = [];
            for (var i in _note) {
              _notesText.push(_note[i].note);
            }
            ayaObj.notes = _notesText.join('<br/>');
          }

          self.surasObj.push(ayaObj);
          self.fetchAya(type, sura, ++aya, from, to);
        }, function(err) {
          self.lastAya = true;
          self.isLoading = false;
          self.scrollSpy();
        });
      } else {
        self.isLoading = false;
        self.scrollSpy();
      }
    };

    document.addEventListener('deviceready', function(){
    self.fetchSurahProps(function() {
      // every new sura, will start with first aya till the limit
      self.fetchAya(self.type, self.sura, 1, self.from, self.to);
    });
    }, false);

    quranService
      .loadAllSuras()
      .then(function(suras) {
        self.quran = suras[parseInt(self.sura) - 1];
        self.suraName = suras[parseInt(self.sura) - 1].name;
        self.suras = suras;
        self.suraOptions = suras;
      });

    quranService
      .loadOptions('modes')
      .then(function(options) {
        self.modes = options;
      });

    self.onClickMode = function(mode) {
      if(mode.toLowerCase().indexOf('trans') > -1) {
        if(!localStorage.getItem('quran.trans')) {
          navigator.notification.alert('You have no any Translation!.', null, 'Translation!', 'Okay');
          return;
        }
      }
      self.optionMode = mode;
      self.quranMode = localStorage.setItem('quran.mode', mode);
      self.quranMode = mode;
      self.from = 1;
      self.surasObj = [];
      self.fetchAya(self.type, self.sura, self.aya, self.from, self.to);
    };

    quranService
      .loadOptions('type')
      .then(function(options) {
        self.types = options;
      });

    self.onClickType = function(type) {
      var
      sql = "SELECT * FROM type WHERE type = ?;",
      param = [type];
      appDb.query(sql, param, function(res) {
        if(res.rows.length) {
          self.optionType = type;
          self.type = type;
          self.from = 1;
          self.surasObj = [];
          self.fetchAya(self.type, self.sura, self.aya, self.from, self.to);
        } else {
          var
          name = '',
          onConfirm = function(buttonIndex) {

            if(buttonIndex == 1) {
              downloaderService
                .download(
                  appConfig.api('quran.content', type+'.zip'),
                  cordova.file.externalDataDirectory+'quran/'+type+'.zip',
                  'Downloading quran - ' + name)
                .then(function(res) {
                  localStorage.setItem('quran.download', true);
                  var
                  sql = "INSERT INTO type (type, status) VALUES (?,?)",
                  param =  [type, 1];
                  appDb.query(sql, param, function(res) {
                    console.log(res);
                  });
                  localStorage.setItem('quran.type', type);
                  self.optionType = type;

                  downloaderService
                  .unzip(
                    cordova.file.externalDataDirectory+'quran/'+type+'.zip',
                    cordova.file.externalDataDirectory +'quran',
                    'Extracting quran - ' + name)
                  .then(function() {
                    self.optionType = type;
                    self.type = type;
                    self.from = 1;
                    self.surasObj = [];
                    self.fetchAya(self.type, self.sura, self.aya, self.from, self.to);
                  });

                });
            } else {
              self.optionType = localStorage.getItem('quran.type') || 'simple';
            }
          };

          for (var i in self.types) {
            if(self.types[i].key == type) {
              name = self.types[i].value;
              break;
            }
          }

          navigator.notification.confirm(
              'Do you want to download quran - ' + name,
               onConfirm,
              'Download Quran',
              ['Download','Cancel']
          );
        }
      });
    };

    self.prevSura = function() {
      if(self.sura > 1) {
        // $location.path('/quran/'+(parseInt(self.sura) - 1) +'/1');
        self.from = 1;
        self.sura = (parseInt(self.sura) - 1);
        self.aya = 1;
        self.surasObj = [];
        self.abortReq(); // abort request before
        self.lastAya = false;
        self.fetchSurahProps(function() {
          self.fetchAya(self.type, self.sura, self.aya, self.from, self.to);
        });
        self.quran = self.suras[parseInt(self.sura) - 1];
        self.suraName = self.suras[parseInt(self.sura) - 1].name;

        localStorage.setItem('quran.sura', self.sura);
        localStorage.setItem('quran.aya', self.aya);

        if(self.sura == 1 || self.sura == 9) {
          self.besmShow = false;
        } else {
          self.besmShow = true;
        }

      } else {
        alert('The first sura!.');
      }
    };

    self.onClickSuraOption = function(sura) {
      self.from = 1;
      self.sura = sura;
      self.aya = 1;
      self.surasObj = [];
      self.abortReq(); // abort request before
      self.lastAya = false;
      self.fetchSurahProps(function() {
        self.fetchAya(self.type, self.sura, self.aya, self.from, self.to);
      });
      self.quran = self.suras[parseInt(self.sura) - 1];
      self.suraName = self.suras[parseInt(self.sura) - 1].name;

      localStorage.setItem('quran.sura', self.sura);
      localStorage.setItem('quran.aya', self.aya);

      if(self.sura == 1 || self.sura == 9) {
        self.besmShow = false;
      } else {
        self.besmShow = true;
      }
    };

    self.onClickShowNotes =  function() {
      if($('.showNotes').is(':checked')) {
        self.showNotes = 1;
        localStorage.setItem('quran.showNotes', 1);
      } else {
        self.showNotes = 0;
        localStorage.setItem('quran.showNotes', 0);
      }
    };

    self.nextSura = function() {

      if(self.sura < (self.suras.length)) {
        // $location.path('/quran/'+(parseInt(self.sura) + 1) +'/1');
        self.from = 1;
        self.sura = (parseInt(self.sura) + 1);
        self.aya = 1;
        self.surasObj = [];
        self.abortReq(); // abort request before
        self.lastAya = false;
        self.quran = self.suras[parseInt(self.sura) - 1];
        self.fetchSurahProps(function() {
          self.fetchAya(self.type, self.sura, self.aya, self.from, self.to);
        });
        self.suraName = self.suras[parseInt(self.sura) - 1].name;

        localStorage.setItem('quran.sura', self.sura);
        localStorage.setItem('quran.aya', self.aya);

        if(self.sura == 1 || self.sura == 9) {
          self.besmShow = false;
        } else {
          self.besmShow = true;
        }

      } else {
        alert('The last sura!.');
      }

    };

    self.ayaSelectedObject = ayaSelectedObject;

    self.generateSelectedAyas = function() {

      self.ayaSelectedObject.sura = self.sura;
      self.ayaSelectedObject.suraName = self.suraName;
      self.ayaSelectedObject.ayas = [];

      var
      list = [],
      stacks = [],
      tmp = 0,
      dis = 0,
      dom = $('#quranview .aya.selected');

      for(var j = 0; j < dom.length; j++) {
        var
        _aya = $(dom[j]).data('aya');
        list.push(_aya);
        self.ayaSelectedObject.ayas.push(self.surasObj[_aya -1 ]);
      }

      for(var i in list) {
        if(!tmp) { // first time loop started
          tmp = list[i];
          stacks.push(list[i]);
        } else {
          if(list[i] == (tmp+1)) {
            tmp = list[i];
            dis++;
          } else {
            if(!dis) {
              stacks.push(',');
              stacks.push(list[i]);
              tmp = list[i];
              dis = 0;
            } else {
              if(dis == 1) {
                stacks.push(',');
                stacks.push(list[i - 1]);
                stacks.push(',');
                stacks.push(list[i]);
                tmp = list[i];
                dis = 0;
              } else {
                stacks.push('-');
                stacks.push(list[i - 1]);
                stacks.push(',');
                stacks.push(list[i]);
                tmp = list[i];
                dis = 0;
              }
            }
          }
        }
      }

      self.ayaSelectedObject.stacks = stacks.join('');
    };

    self.addNotes = function() {
      self.generateSelectedAyas();
      $location.path('/note');
    };

    self.addHighlight = function() {
      self.generateSelectedAyas();
      $location.path('/highlight');
    };

    self.addBookmark = function() {
      self.generateSelectedAyas();
      $location.path('/bookmark');
    };

    self.addLabel = function() {
      self.generateSelectedAyas();
      $location.path('/label');
    };

    self.selectedAya = false;
    $('#quranview').off('click').on('click', '.aya', function(evt) {
      var
      $target = $(evt.target).parents('.aya');
      if($target.hasClass('selected')) {
        $target.removeClass('selected');
      } else {
        $target.addClass('selected');
      }

      var
      selected = $('#quranview .aya.selected').length;
      if(selected) {
        self.selectedAya = true;
        $('#quranview .fixed-action-btn').show();
        $('#quranview .floatingBtn').hide();
        $('.fixed-action-btn').openFAB();
      } else {
        self.selectedAya = false;
        $('#quranview .fixed-action-btn').hide();
        $('#quranview .floatingBtn').show();
        $('.fixed-action-btn').closeFAB();
      }

    });

    /**
     * Load more aya on current sura
     * @return {[json]} [object aya]
     */

    self.topPos = 0;
    $window.onscroll = function() {
      var quranview = document.getElementById('quranview');

      if(quranview.scrollHeight == (document.body.scrollTop + $window.innerHeight)) {
        if(!self.lastAya && !self.isLoading) {
          self.aya = self.to + 1;
          self.from = self.aya;
          self.to += self.limit;
          self.fetchAya(self.type, self.sura, self.aya, self.from, self.to);
        }
      }

      if(self.topPos < document.body.scrollTop) {
        self.topNavbar = false;
        $('.floatingBtn').hide();
        document.getElementById('topNavBarHome').style.display = 'none';
        document.getElementById('topNavBarDetail').style.display = 'block';
      } else {
        self.topNavbar = true;
        if(!self.selectedAya) {
          $('.floatingBtn').show();
        }
        document.getElementById('topNavBarHome').style.display = 'block';
        document.getElementById('topNavBarDetail').style.display = 'none';
      }

      self.topPos = document.body.scrollTop;

    };

    $('.button-collapse').sideNav();
    $('.modal-trigger').leanModal();
    var
    tapSlider = document.getElementById('tapSlider'),
    quranTab = document.getElementById('quran-tab'),
    fontSize = localStorage.getItem('quran.font.size') || 19;

    quranTab.style.fontSize = fontSize+'px';

    noUiSlider.create(tapSlider, {
      start: fontSize,
      behaviour: 'tap',
      connect: 'lower',
      step: 1,
      range: {
        'min':  8,
        'max':  24
      }
    });

    var
    fontSizeInfo = document.getElementById('fontSizeInfo') ;

    tapSlider.noUiSlider.on('update', function ( values, handle ) {
      var size = values[handle].toString().replace('.00','');
      localStorage.setItem('quran.font.size', size);
      quranTab.style.fontSize = size+'px';
      fontSizeInfo.innerHTML = size+'pt';
    });
  }

  function TransController($scope, quranService, $log, $q, $http, $routeParams, $window, $location, appDb, downloaderService, appConfig) {

    var
    self = $scope;
    self.optionTrans = localStorage.getItem('quran.trans') || '';
    self.menuName = 'Translation';
    self.trans = [];

    quranService
      .loadOptions('trans')
      .then(function(options) {
        self.trans = options;
      });

    self.onClickTrans = function(trans) {
      var
      sql = "SELECT * FROM trans WHERE trans = ?;",
      param = [trans];
      appDb.query(sql, param, function(res) {
        if(res.rows.length) {
          self.optionTrans = trans;
        } else {
          var
          name = '',
          onConfirm = function(buttonIndex) {

            if(buttonIndex == 1) {
              downloaderService
                .download(
                  appConfig.api('trans.content', trans+'.zip'),
                  cordova.file.externalDataDirectory+'trans/'+trans+'.zip',
                  'Downloading translation - ' + name)
                .then(function(res) {

                  var
                  sql = "INSERT INTO trans (trans, status) VALUES (?,?)",
                  param =  [trans, 1];
                  appDb.query(sql, param, function(res) {
                    console.log(res);
                  });
                  localStorage.setItem('quran.trans', trans);
                  self.optionTrans = trans;

                  downloaderService
                  .unzip(
                    cordova.file.externalDataDirectory+'trans/'+trans+'.zip',
                    cordova.file.externalDataDirectory +'trans',
                    'Extracting translation - ' + name)
                  .then(function() {
                    self.optionTrans = trans;
                  });

                });
            } else {
              self.optionTrans = localStorage.getItem('quran.trans') || null;
            }
          };

          for (var i in self.trans) {
            if(self.trans[i].id == trans) {
              name = self.trans[i].translator;
              break;
            }
          }

          navigator.notification.confirm(
              'Do you want to download translation - ' + name,
               onConfirm,
              'Translation',
              ['Download','Cancel']
          );
        }
      });
    };

    self.onSave =  function(save) {
      localStorage.setItem('quran.trans', self.optionTrans);
      $location.path('/quran');
    };

    $window.onscroll = null;
    $('.drag-target, #sidenav-overlay').remove();
    $('body').css('overflow', 'auto');
  }

  function SuraController($scope, quranService, $log, $q, $http, $routeParams, $window, $location) {
    var
    self = $scope;
    self.suras = [];

    quranService
      .loadAllSuras()
      .then(function(suras) {
        self.suras = suras;
      });

    $window.onscroll = null;
    $('.drag-target, #sidenav-overlay').remove();
    $('body').css('overflow', 'auto');
  }

  function JuzController($scope, quranService, $log, $q, $http, $routeParams, $window, $location) {
    var
    self = $scope;
    self.juz = [];

    quranService
      .getJuz()
      .then(function(juz) {

        self.juz = juz;
        setTimeout(function() {
          $('.collapsible').collapsible({
            accordion : false
          });
        }, 1000);
      });
    $window.onscroll = null;
    $('.drag-target, #sidenav-overlay').remove();
    $('body').css('overflow', 'auto');
  }

})();
(function(){

  angular
    .module('module.quran')

    .controller('BookmarkController', [
    '$scope', 'quranService', '$log', '$q', '$http', '$routeParams', '$window', '$location', 'ayaSelectedObject', 'appDb', '$timeout',
      BookmarkController
    ])
    .controller('BookmarklistController', [
    '$scope', 'quranService', '$log', '$q', '$http', '$routeParams', '$window', '$location', 'ayaSelectedObject', 'appDb', '$timeout',
      BookmarklistController
    ]);


function BookmarkController($scope, quranService, $log, $q, $http, $routeParams, $window, $location, ayaSelectedObject, appDb, $timeout) {
  var
  self = $scope;
  self.suraName = ayaSelectedObject.suraName;
  self.sura = ayaSelectedObject.sura;
  self.ayas = ayaSelectedObject.ayas;
  self.stacks = ayaSelectedObject.stacks;

  self.onSave = function() {
    // 'CREATE TABLE IF NOT EXISTS bookmarks  (id INTEGER PRIMARY KEY, sura_name TEXT, sura INTEGER, aya INTEGER, bookmark_date TEXT)',
    // ActivityIndicator.show('Saving bookmark...');
    var
    sql = "INSERT INTO bookmarks (sura_name, sura, aya, aya_text, bookmark_date) VALUES (?,?,?,?,?)",
    _date = new Date().toUTCString();

    for (var i in self.ayas) {
      var
      param = [];
      param.push(self.suraName);
      param.push(self.ayas[i].sura);
      param.push(self.ayas[i].aya);
      param.push(self.ayas[i].text);
      param.push(_date);

      appDb.query(sql, param, function(res) {
        // console.log(res);
      });
    }

    window.plugins.toast.show('Bookmark saved!.', 'long', 'bottom');
    $timeout(function(){
      // ActivityIndicator.hide();
      $location.path('/quran');
    }, 300);

  };

  $window.onscroll = null;
  $('.drag-target, #sidenav-overlay').remove();
  $('body').css('overflow', 'auto');
}

function BookmarklistController($scope, quranService, $log, $q, $http, $routeParams, $window, $location, ayaSelectedObject, appDb, $timeout) {

  var
  self = $scope,
  sql = "SELECT * FROM bookmarks;";

  self.bookmarks = [];
  appDb.query(sql, [], function(res) {
    if(res.rows.length) {
      for (var i = 0; i < res.rows.length; i++) {
        self.bookmarks.push(res.rows.item(i));
      }
    }
    self.$apply();
  });

  self.deleteBookmark = function(id) {

    navigator.notification.confirm(
      'Do you want to delete this bookmark ?.',
      function(buttonIndex) {
        if(buttonIndex == 1) {
          var
          sql = "DELETE FROM bookmarks WHERE id=?;",
          param = [id];
          appDb.query(sql, param, function(res) {
            for (var i in self.bookmarks) {
              if (self.bookmarks[i].id == id) {
                self.bookmarks.splice(i, 1);
                self.$apply();
                break;
              }
            }
            window.plugins.toast.show('Bookmark deleted!.', 'long', 'bottom');
          });
        }
      },
      'Delete',
      ['Delete','Cancel']
    );
  };

  $window.onscroll = null;
  $('.drag-target, #sidenav-overlay').remove();
  $('body').css('overflow', 'auto');
}

}());
(function(){

  angular
    .module('module.quran')
    .controller('NoteController', [
      '$scope', 'quranService', '$log', '$q', '$http', '$routeParams', '$window', '$location', 'ayaSelectedObject', 'appDb',
      NoteController
    ])
    .controller('NoteDetailController', [
      '$scope', 'quranService', '$log', '$q', '$http', '$routeParams', '$window', '$location', 'appDb', '$timeout',
      NoteDetailController
    ])
    .controller('NotelistController', [
      '$scope', 'quranService', '$log', '$q', '$http', '$routeParams', '$window', '$location', 'ayaSelectedObject', 'appDb',
      NotelistController
    ]);


function NoteController($scope, quranService, $log, $q, $http, $routeParams, $window, $location, ayaSelectedObject, appDb) {
  var
  self = $scope;
  self.suraName = ayaSelectedObject.suraName;
  self.sura = ayaSelectedObject.sura;
  self.ayas = ayaSelectedObject.ayas;
  self.stacks = ayaSelectedObject.stacks;
  self.note = '';

  self.onSave = function() {
    // sura_name TEXT, sura INTEGER, aya INTEGER, aya_text TEXT, note_group TEXT, note TEXT, note_date TEXT
    ActivityIndicator.show('Saving note...');
    var
    sql = "INSERT INTO notes (sura_name, sura, aya, aya_text, note_group, note, note_date) VALUES (?,?,?,?,?,?,?)",
    _date = new Date().toUTCString();

    for (var i in self.ayas) {
      var
      param = [];
      param.push(self.suraName);
      param.push(self.ayas[i].sura);
      param.push(self.ayas[i].aya);
      param.push(self.ayas[i].text);
      param.push(self.stacks);
      param.push(self.note);
      param.push(_date);

      appDb.query(sql, param, function(res) {
        // console.log(res);
      });
    }

    setTimeout(function() {
      ActivityIndicator.hide();
    }, 300);
    window.plugins.toast.show('Note saved!.', 'long', 'bottom');
    $location.path('/quran');

  };

  $window.onscroll = null;
  $('.drag-target, #sidenav-overlay').remove();
  $('body').css('overflow', 'auto');
}

function NoteDetailController($scope, quranService, $log, $q, $http, $routeParams, $window, $location, appDb, $timeout) {
  var
  self = $scope;
  self.suraName = '';
  self.sura = '';
  self.group = '';
  self.note = '';

  var
  sql = "SELECT * FROM notes WHERE id = ?;";
  appDb.query(sql, [$routeParams.id], function(res) {
    var
    _aya = res.rows.item(0);
    self.suraName = _aya.sura_name;
    self.sura = _aya.sura;
    self.group = _aya.note_group;
    self.note = _aya.note;
    $scope.$apply();
  });

  self.onSave = function() {
    // sura_name TEXT, sura INTEGER, aya INTEGER, aya_text TEXT, note_group TEXT, note TEXT, note_date TEXT
    ActivityIndicator.show('Updating note...');
    var
    sql = "UPDATE notes SET note=? WHERE id=?;",
    param = [$scope.note,$routeParams.id];
    appDb.query(sql, param, function(res) {
      window.plugins.toast.show('Note saved!.', 'long', 'bottom');
      $timeout(function(){
        ActivityIndicator.hide();
        $location.path('/note/list');
      }, 300);
    });
  };

  $scope.onDelete =  function() {

    navigator.notification.confirm(
        'Do you want to delete this note ?.',
        function(buttonIndex) {
          if(buttonIndex == 1) {
            // sura_name TEXT, sura INTEGER, aya INTEGER, aya_text TEXT, note_group TEXT, note TEXT, note_date TEXT
            ActivityIndicator.show('Deleting note...');

            var
            sql = "DELETE FROM notes WHERE id=?;",
            param = [$routeParams.id];
            appDb.query(sql, param, function(res) {
              window.plugins.toast.show('Note deleted!.', 'long', 'bottom');
              $timeout(function(){
                $location.path('/note/list');
                ActivityIndicator.hide();
              }, 300);
            });
          }
        },
        'Delete',
        ['Delete','Cancel']
    );

  };

  $window.onscroll = null;
  $('.drag-target, #sidenav-overlay').remove();
  $('body').css('overflow', 'auto');
}

function NotelistController($scope, quranService, $log, $q, $http, $routeParams, $window, $location, ayaSelectedObject, appDb) {
  var
  sql = "SELECT * FROM notes GROUP BY note_date;";
  $scope.notes = [];
    appDb.query(sql, [], function(res) {
      if(res.rows.length) {
        for (var i = 0; i < res.rows.length; i++) {
          $scope.notes.push(res.rows.item(i));
        }
      }
      $scope.$apply();
    });
  $window.onscroll = null;

  $scope.showNoteDetail = function(id) {
    $location.path('/note/detail/'+id);
  };

  $('.drag-target, #sidenav-overlay').remove();
  $('body').css('overflow', 'auto');
}

}());
(function(){

  angular
    .module('module.quran')
    .controller('HighlightController', [
      '$scope', 'quranService', '$log', '$q', '$http', '$routeParams', '$window', '$location', 'ayaSelectedObject', 'appDb', '$timeout',
      HighlightController
    ])
    .controller('HighlightListController', [
      '$scope', 'quranService', '$log', '$q', '$http', '$routeParams', '$window', '$location', 'ayaSelectedObject', 'appDb', '$timeout',
      HighlightListController
    ]);


function HighlightController($scope, quranService, $log, $q, $http, $routeParams, $window, $location, ayaSelectedObject, appDb, $timeout) {
  var
  self = $scope;
  self.suraName = ayaSelectedObject.suraName;
  self.sura = ayaSelectedObject.sura;
  self.ayas = ayaSelectedObject.ayas;
  self.stacks = ayaSelectedObject.stacks;
  self.color = 'yellow lighten-1';

  self.pickColor = function(colorName) {
    self.color = colorName;
    $('#quranText').removeClass().addClass('quranText ' + colorName);
  };

  self.onSave = function() {
    // 'CREATE TABLE IF NOT EXISTS highlights (id INTEGER PRIMARY KEY, sura_name TEXT, sura INTEGER, aya INTEGER, aya_text TEXT, color TEXT, highlight_date TEXT)'
    // ActivityIndicator.show('Saving highlight...');
    var
    sql = "INSERT INTO highlights (sura_name, sura, aya, aya_text, color, highlight_date) VALUES (?,?,?,?,?,?)",
    _date = new Date().toUTCString();

    for (var i in self.ayas) {
      var
      param = [];
      param.push(self.suraName);
      param.push(self.ayas[i].sura);
      param.push(self.ayas[i].aya);
      param.push(self.ayas[i].text);
      param.push(self.color);
      param.push(_date);

      appDb.query(sql, param, function(res) {
        // console.log(res);
      });
    }

    window.plugins.toast.show('Highlight saved!.', 'long', 'bottom');
    $timeout(function(){
      // ActivityIndicator.hide();
      $location.path('/quran');
    }, 300);

  };

  $window.onscroll = null;
  $('.drag-target, #sidenav-overlay').remove();
  $('body').css('overflow', 'auto');
}


function HighlightListController($scope, quranService, $log, $q, $http, $routeParams, $window, $location, ayaSelectedObject, appDb) {
  var
  sql = "SELECT * FROM highlights;",
  self = $scope;
  self.highlights = [];

  appDb.query(sql, [], function(res) {
    if(res.rows.length) {
      for (var i = 0; i < res.rows.length; i++) {
        self.highlights.push(res.rows.item(i));
      }
    }
    self.$apply();
  });

  self.deleteHighlight = function(id) {

    navigator.notification.confirm(
        'Do you want to delete this highlight ?.',
        function(buttonIndex) {
          if(buttonIndex == 1) {
            // sura_name TEXT, sura INTEGER, aya INTEGER, aya_text TEXT, note_group TEXT, note TEXT, note_date TEXT
            // ActivityIndicator.show('Deleting highlight...');
            var
            sql = "DELETE FROM highlights WHERE id=?;",
            param = [id];
            appDb.query(sql, param, function(res) {
              window.plugins.toast.show('Highlight deleted!.', 'long', 'bottom');
              for (var i in self.highlights) {
                if (self.highlights[i].id == id) {
                  self.highlights.splice(i, 1);
                  self.$apply();
                  break;
                }
              }
            });
          }
        },
        'Delete',
        ['Delete','Cancel']
    );
  };

  $window.onscroll = null;
  $('.drag-target, #sidenav-overlay').remove();
  $('body').css('overflow', 'auto');
}


}());
(function(){

angular
  .module('module.quran')
  .controller('LabelController', [
    '$scope', 'quranService', '$log', '$q', '$http', '$routeParams', '$window', '$location', 'appDb', 'ayaSelectedObject',
    LabelController
  ]);

function LabelController($scope, quranService, $log, $q, $http, $routeParams, $window, $location, ayaSelectedObject) {
  var
  self = $scope;
  self.suraName = ayaSelectedObject.suraName;
  self.sura = ayaSelectedObject.sura;
  self.ayas = ayaSelectedObject.ayas;
  self.stacks = ayaSelectedObject.stacks;
  $window.onscroll = null;
  $('.drag-target, #sidenav-overlay').remove();
  $('body').css('overflow', 'auto');
}

}());
'use strict';

angular.module('module.quran')

.config(['$routeProvider', function($routeProvider) {

  $routeProvider.when('/quran/:sura/:aya', {
    templateUrl: 'http://iqurankareem.github.io/www/app/module/quran/template/reader.html',
    controller: 'QuranController'
  });

}]);
(function(){
  'use strict';

  angular.module('module.quran')
         .service('quranService', ['$q', '$http', UserService]);

  /**
   * Quran DataService
   * Uses embedded, hard-coded data model; acts asynchronously to simulate
   * remote data service call(s).
   *
   * @returns {{loadAll: Function}}
   * @constructor
   */
  function UserService($q, $http){

    // Quran Metadata (ver 1.0)
    // Copyright (C) 2008-2009 Tanzil.info
    // License: Creative Commons Attribution 3.0

    var QuranData = {};

    //------------------ Sura Data ---------------------

    QuranData.Sura = [
      // [start, ayas, order, rukus, name, tname, ename, type]
      [],
      [0, 7, 5, 1, 'الفاتحة', "Al-Faatiha", 'The Opening', 'Meccan'],
      [7, 286, 87, 40, 'البقرة', "Al-Baqara", 'The Cow', 'Medinan'],
      [293, 200, 89, 20, 'آل عمران', "Aal-i-Imraan", 'The Family of Imraan', 'Medinan'],
      [493, 176, 92, 24, 'النساء', "An-Nisaa", 'The Women', 'Medinan'],
      [669, 120, 112, 16, 'المائدة', "Al-Maaida", 'The Table', 'Medinan'],
      [789, 165, 55, 20, 'الأنعام', "Al-An'aam", 'The Cattle', 'Meccan'],
      [954, 206, 39, 24, 'الأعراف', "Al-A'raaf", 'The Heights', 'Meccan'],
      [1160, 75, 88, 10, 'الأنفال', "Al-Anfaal", 'The Spoils of War', 'Medinan'],
      [1235, 129, 113, 16, 'التوبة', "At-Tawba", 'The Repentance', 'Medinan'],
      [1364, 109, 51, 11, 'يونس', "Yunus", 'Jonas', 'Meccan'],
      [1473, 123, 52, 10, 'هود', "Hud", 'Hud', 'Meccan'],
      [1596, 111, 53, 12, 'يوسف', "Yusuf", 'Joseph', 'Meccan'],
      [1707, 43, 96, 6, 'الرعد', "Ar-Ra'd", 'The Thunder', 'Medinan'],
      [1750, 52, 72, 7, 'ابراهيم', "Ibrahim", 'Abraham', 'Meccan'],
      [1802, 99, 54, 6, 'الحجر', "Al-Hijr", 'The Rock', 'Meccan'],
      [1901, 128, 70, 16, 'النحل', "An-Nahl", 'The Bee', 'Meccan'],
      [2029, 111, 50, 12, 'الإسراء', "Al-Israa", 'The Night Journey', 'Meccan'],
      [2140, 110, 69, 12, 'الكهف', "Al-Kahf", 'The Cave', 'Meccan'],
      [2250, 98, 44, 6, 'مريم', "Maryam", 'Mary', 'Meccan'],
      [2348, 135, 45, 8, 'طه', "Taa-Haa", 'Taa-Haa', 'Meccan'],
      [2483, 112, 73, 7, 'الأنبياء', "Al-Anbiyaa", 'The Prophets', 'Meccan'],
      [2595, 78, 103, 10, 'الحج', "Al-Hajj", 'The Pilgrimage', 'Medinan'],
      [2673, 118, 74, 6, 'المؤمنون', "Al-Muminoon", 'The Believers', 'Meccan'],
      [2791, 64, 102, 9, 'النور', "An-Noor", 'The Light', 'Medinan'],
      [2855, 77, 42, 6, 'الفرقان', "Al-Furqaan", 'The Criterion', 'Meccan'],
      [2932, 227, 47, 11, 'الشعراء', "Ash-Shu'araa", 'The Poets', 'Meccan'],
      [3159, 93, 48, 7, 'النمل', "An-Naml", 'The Ant', 'Meccan'],
      [3252, 88, 49, 8, 'القصص', "Al-Qasas", 'The Stories', 'Meccan'],
      [3340, 69, 85, 7, 'العنكبوت', "Al-Ankaboot", 'The Spider', 'Meccan'],
      [3409, 60, 84, 6, 'الروم', "Ar-Room", 'The Romans', 'Meccan'],
      [3469, 34, 57, 3, 'لقمان', "Luqman", 'Luqman', 'Meccan'],
      [3503, 30, 75, 3, 'السجدة', "As-Sajda", 'The Prostration', 'Meccan'],
      [3533, 73, 90, 9, 'الأحزاب', "Al-Ahzaab", 'The Clans', 'Medinan'],
      [3606, 54, 58, 6, 'سبإ', "Saba", 'Sheba', 'Meccan'],
      [3660, 45, 43, 5, 'فاطر', "Faatir", 'The Originator', 'Meccan'],
      [3705, 83, 41, 5, 'يس', "Yaseen", 'Yaseen', 'Meccan'],
      [3788, 182, 56, 5, 'الصافات', "As-Saaffaat", 'Those drawn up in Ranks', 'Meccan'],
      [3970, 88, 38, 5, 'ص', "Saad", 'The letter Saad', 'Meccan'],
      [4058, 75, 59, 8, 'الزمر', "Az-Zumar", 'The Groups', 'Meccan'],
      [4133, 85, 60, 9, 'غافر', "Al-Ghaafir", 'The Forgiver', 'Meccan'],
      [4218, 54, 61, 6, 'فصلت', "Fussilat", 'Explained in detail', 'Meccan'],
      [4272, 53, 62, 5, 'الشورى', "Ash-Shura", 'Consultation', 'Meccan'],
      [4325, 89, 63, 7, 'الزخرف', "Az-Zukhruf", 'Ornaments of gold', 'Meccan'],
      [4414, 59, 64, 3, 'الدخان', "Ad-Dukhaan", 'The Smoke', 'Meccan'],
      [4473, 37, 65, 4, 'الجاثية', "Al-Jaathiya", 'Crouching', 'Meccan'],
      [4510, 35, 66, 4, 'الأحقاف', "Al-Ahqaf", 'The Dunes', 'Meccan'],
      [4545, 38, 95, 4, 'محمد', "Muhammad", 'Muhammad', 'Medinan'],
      [4583, 29, 111, 4, 'الفتح', "Al-Fath", 'The Victory', 'Medinan'],
      [4612, 18, 106, 2, 'الحجرات', "Al-Hujuraat", 'The Inner Apartments', 'Medinan'],
      [4630, 45, 34, 3, 'ق', "Qaaf", 'The letter Qaaf', 'Meccan'],
      [4675, 60, 67, 3, 'الذاريات', "Adh-Dhaariyat", 'The Winnowing Winds', 'Meccan'],
      [4735, 49, 76, 2, 'الطور', "At-Tur", 'The Mount', 'Meccan'],
      [4784, 62, 23, 3, 'النجم', "An-Najm", 'The Star', 'Meccan'],
      [4846, 55, 37, 3, 'القمر', "Al-Qamar", 'The Moon', 'Meccan'],
      [4901, 78, 97, 3, 'الرحمن', "Ar-Rahmaan", 'The Beneficent', 'Medinan'],
      [4979, 96, 46, 3, 'الواقعة', "Al-Waaqia", 'The Inevitable', 'Meccan'],
      [5075, 29, 94, 4, 'الحديد', "Al-Hadid", 'The Iron', 'Medinan'],
      [5104, 22, 105, 3, 'المجادلة', "Al-Mujaadila", 'The Pleading Woman', 'Medinan'],
      [5126, 24, 101, 3, 'الحشر', "Al-Hashr", 'The Exile', 'Medinan'],
      [5150, 13, 91, 2, 'الممتحنة', "Al-Mumtahana", 'She that is to be examined', 'Medinan'],
      [5163, 14, 109, 2, 'الصف', "As-Saff", 'The Ranks', 'Medinan'],
      [5177, 11, 110, 2, 'الجمعة', "Al-Jumu'a", 'Friday', 'Medinan'],
      [5188, 11, 104, 2, 'المنافقون', "Al-Munaafiqoon", 'The Hypocrites', 'Medinan'],
      [5199, 18, 108, 2, 'التغابن', "At-Taghaabun", 'Mutual Disillusion', 'Medinan'],
      [5217, 12, 99, 2, 'الطلاق', "At-Talaaq", 'Divorce', 'Medinan'],
      [5229, 12, 107, 2, 'التحريم', "At-Tahrim", 'The Prohibition', 'Medinan'],
      [5241, 30, 77, 2, 'الملك', "Al-Mulk", 'The Sovereignty', 'Meccan'],
      [5271, 52, 2, 2, 'القلم', "Al-Qalam", 'The Pen', 'Meccan'],
      [5323, 52, 78, 2, 'الحاقة', "Al-Haaqqa", 'The Reality', 'Meccan'],
      [5375, 44, 79, 2, 'المعارج', "Al-Ma'aarij", 'The Ascending Stairways', 'Meccan'],
      [5419, 28, 71, 2, 'نوح', "Nooh", 'Noah', 'Meccan'],
      [5447, 28, 40, 2, 'الجن', "Al-Jinn", 'The Jinn', 'Meccan'],
      [5475, 20, 3, 2, 'المزمل', "Al-Muzzammil", 'The Enshrouded One', 'Meccan'],
      [5495, 56, 4, 2, 'المدثر', "Al-Muddaththir", 'The Cloaked One', 'Meccan'],
      [5551, 40, 31, 2, 'القيامة', "Al-Qiyaama", 'The Resurrection', 'Meccan'],
      [5591, 31, 98, 2, 'الانسان', "Al-Insaan", 'Man', 'Medinan'],
      [5622, 50, 33, 2, 'المرسلات', "Al-Mursalaat", 'The Emissaries', 'Meccan'],
      [5672, 40, 80, 2, 'النبإ', "An-Naba", 'The Announcement', 'Meccan'],
      [5712, 46, 81, 2, 'النازعات', "An-Naazi'aat", 'Those who drag forth', 'Meccan'],
      [5758, 42, 24, 1, 'عبس', "Abasa", 'He frowned', 'Meccan'],
      [5800, 29, 7, 1, 'التكوير', "At-Takwir", 'The Overthrowing', 'Meccan'],
      [5829, 19, 82, 1, 'الإنفطار', "Al-Infitaar", 'The Cleaving', 'Meccan'],
      [5848, 36, 86, 1, 'المطففين', "Al-Mutaffifin", 'Defrauding', 'Meccan'],
      [5884, 25, 83, 1, 'الإنشقاق', "Al-Inshiqaaq", 'The Splitting Open', 'Meccan'],
      [5909, 22, 27, 1, 'البروج', "Al-Burooj", 'The Constellations', 'Meccan'],
      [5931, 17, 36, 1, 'الطارق', "At-Taariq", 'The Morning Star', 'Meccan'],
      [5948, 19, 8, 1, 'الأعلى', "Al-A'laa", 'The Most High', 'Meccan'],
      [5967, 26, 68, 1, 'الغاشية', "Al-Ghaashiya", 'The Overwhelming', 'Meccan'],
      [5993, 30, 10, 1, 'الفجر', "Al-Fajr", 'The Dawn', 'Meccan'],
      [6023, 20, 35, 1, 'البلد', "Al-Balad", 'The City', 'Meccan'],
      [6043, 15, 26, 1, 'الشمس', "Ash-Shams", 'The Sun', 'Meccan'],
      [6058, 21, 9, 1, 'الليل', "Al-Lail", 'The Night', 'Meccan'],
      [6079, 11, 11, 1, 'الضحى', "Ad-Dhuhaa", 'The Morning Hours', 'Meccan'],
      [6090, 8, 12, 1, 'الشرح', "Ash-Sharh", 'The Consolation', 'Meccan'],
      [6098, 8, 28, 1, 'التين', "At-Tin", 'The Fig', 'Meccan'],
      [6106, 19, 1, 1, 'العلق', "Al-Alaq", 'The Clot', 'Meccan'],
      [6125, 5, 25, 1, 'القدر', "Al-Qadr", 'The Power, Fate', 'Meccan'],
      [6130, 8, 100, 1, 'البينة', "Al-Bayyina", 'The Evidence', 'Medinan'],
      [6138, 8, 93, 1, 'الزلزلة', "Az-Zalzala", 'The Earthquake', 'Medinan'],
      [6146, 11, 14, 1, 'العاديات', "Al-Aadiyaat", 'The Chargers', 'Meccan'],
      [6157, 11, 30, 1, 'القارعة', "Al-Qaari'a", 'The Calamity', 'Meccan'],
      [6168, 8, 16, 1, 'التكاثر', "At-Takaathur", 'Competition', 'Meccan'],
      [6176, 3, 13, 1, 'العصر', "Al-Asr", 'The Declining Day, Epoch', 'Meccan'],
      [6179, 9, 32, 1, 'الهمزة', "Al-Humaza", 'The Traducer', 'Meccan'],
      [6188, 5, 19, 1, 'الفيل', "Al-Fil", 'The Elephant', 'Meccan'],
      [6193, 4, 29, 1, 'قريش', "Quraish", 'Quraysh', 'Meccan'],
      [6197, 7, 17, 1, 'الماعون', "Al-Maa'un", 'Almsgiving', 'Meccan'],
      [6204, 3, 15, 1, 'الكوثر', "Al-Kawthar", 'Abundance', 'Meccan'],
      [6207, 6, 18, 1, 'الكافرون', "Al-Kaafiroon", 'The Disbelievers', 'Meccan'],
      [6213, 3, 114, 1, 'النصر', "An-Nasr", 'Divine Support', 'Medinan'],
      [6216, 5, 6, 1, 'المسد', "Al-Masad", 'The Palm Fibre', 'Meccan'],
      [6221, 4, 22, 1, 'الإخلاص', "Al-Ikhlaas", 'Sincerity', 'Meccan'],
      [6225, 5, 20, 1, 'الفلق', "Al-Falaq", 'The Dawn', 'Meccan'],
      [6230, 6, 21, 1, 'الناس', "An-Naas", 'Mankind', 'Meccan'],
      // [6236, 1]
    ];


    //------------------ Juz Data ---------------------

    QuranData.Juz = [
      // [sura, aya]
      [],
      [1, 1],   [2, 142],   [2, 253],   [3, 93],  [4, 24],
      [4, 148],   [5, 82],  [6, 111],   [7, 88],  [8, 41],
      [9, 93],  [11, 6],  [12, 53],   [15, 1],  [17, 1],
      [18, 75],   [21, 1],  [23, 1],  [25, 21],   [27, 56],
      [29, 46],   [33, 31],   [36, 28],   [39, 32],   [41, 47],
      [46, 1],  [51, 31],   [58, 1],  [67, 1],  [78, 1],
      [115, 1]
    ];

    //------------------ Hizb Data ---------------------

    QuranData.HizbQaurter = [
      // [sura, aya]
      [],
      [1, 1],   [2, 26],  [2, 44],  [2, 60],
      [2, 75],  [2, 92],  [2, 106],   [2, 124],
      [2, 142],   [2, 158],   [2, 177],   [2, 189],
      [2, 203],   [2, 219],   [2, 233],   [2, 243],
      [2, 253],   [2, 263],   [2, 272],   [2, 283],
      [3, 15],  [3, 33],  [3, 52],  [3, 75],
      [3, 93],  [3, 113],   [3, 133],   [3, 153],
      [3, 171],   [3, 186],   [4, 1],   [4, 12],
      [4, 24],  [4, 36],  [4, 58],  [4, 74],
      [4, 88],  [4, 100],   [4, 114],   [4, 135],
      [4, 148],   [4, 163],   [5, 1],   [5, 12],
      [5, 27],  [5, 41],  [5, 51],  [5, 67],
      [5, 82],  [5, 97],  [5, 109],   [6, 13],
      [6, 36],  [6, 59],  [6, 74],  [6, 95],
      [6, 111],   [6, 127],   [6, 141],   [6, 151],
      [7, 1],   [7, 31],  [7, 47],  [7, 65],
      [7, 88],  [7, 117],   [7, 142],   [7, 156],
      [7, 171],   [7, 189],   [8, 1],   [8, 22],
      [8, 41],  [8, 61],  [9, 1],   [9, 19],
      [9, 34],  [9, 46],  [9, 60],  [9, 75],
      [9, 93],  [9, 111],   [9, 122],   [10, 11],
      [10, 26],   [10, 53],   [10, 71],   [10, 90],
      [11, 6],  [11, 24],   [11, 41],   [11, 61],
      [11, 84],   [11, 108],  [12, 7],  [12, 30],
      [12, 53],   [12, 77],   [12, 101],  [13, 5],
      [13, 19],   [13, 35],   [14, 10],   [14, 28],
      [15, 1],  [15, 50],   [16, 1],  [16, 30],
      [16, 51],   [16, 75],   [16, 90],   [16, 111],
      [17, 1],  [17, 23],   [17, 50],   [17, 70],
      [17, 99],   [18, 17],   [18, 32],   [18, 51],
      [18, 75],   [18, 99],   [19, 22],   [19, 59],
      [20, 1],  [20, 55],   [20, 83],   [20, 111],
      [21, 1],  [21, 29],   [21, 51],   [21, 83],
      [22, 1],  [22, 19],   [22, 38],   [22, 60],
      [23, 1],  [23, 36],   [23, 75],   [24, 1],
      [24, 21],   [24, 35],   [24, 53],   [25, 1],
      [25, 21],   [25, 53],   [26, 1],  [26, 52],
      [26, 111],  [26, 181],  [27, 1],  [27, 27],
      [27, 56],   [27, 82],   [28, 12],   [28, 29],
      [28, 51],   [28, 76],   [29, 1],  [29, 26],
      [29, 46],   [30, 1],  [30, 31],   [30, 54],
      [31, 22],   [32, 11],   [33, 1],  [33, 18],
      [33, 31],   [33, 51],   [33, 60],   [34, 10],
      [34, 24],   [34, 46],   [35, 15],   [35, 41],
      [36, 28],   [36, 60],   [37, 22],   [37, 83],
      [37, 145],  [38, 21],   [38, 52],   [39, 8],
      [39, 32],   [39, 53],   [40, 1],  [40, 21],
      [40, 41],   [40, 66],   [41, 9],  [41, 25],
      [41, 47],   [42, 13],   [42, 27],   [42, 51],
      [43, 24],   [43, 57],   [44, 17],   [45, 12],
      [46, 1],  [46, 21],   [47, 10],   [47, 33],
      [48, 18],   [49, 1],  [49, 14],   [50, 27],
      [51, 31],   [52, 24],   [53, 26],   [54, 9],
      [55, 1],  [56, 1],  [56, 75],   [57, 16],
      [58, 1],  [58, 14],   [59, 11],   [60, 7],
      [62, 1],  [63, 4],  [65, 1],  [66, 1],
      [67, 1],  [68, 1],  [69, 1],  [70, 19],
      [72, 1],  [73, 20],   [75, 1],  [76, 19],
      [78, 1],  [80, 1],  [82, 1],  [84, 1],
      [87, 1],  [90, 1],  [94, 1],  [100, 9],
      [115, 1]
    ];

    //------------------ Manzil Data ---------------------

    QuranData.Manzil = [
      // [sura, aya]
      [],
      [1, 1],   [5, 1],   [10, 1],  [17, 1],
      [26, 1],  [37, 1],  [50, 1]
    ];


    //------------------ Ruku Data ---------------------

    QuranData.Ruku = [
      // [sura, aya]
      [],
      [1, 1],   [2, 1],   [2, 8],   [2, 21],  [2, 30],
      [2, 40],  [2, 47],  [2, 60],  [2, 62],  [2, 72],
      [2, 83],  [2, 87],  [2, 97],  [2, 104],   [2, 113],
      [2, 122],   [2, 130],   [2, 142],   [2, 148],   [2, 153],
      [2, 164],   [2, 168],   [2, 177],   [2, 183],   [2, 189],
      [2, 197],   [2, 211],   [2, 217],   [2, 222],   [2, 229],
      [2, 232],   [2, 236],   [2, 243],   [2, 249],   [2, 254],
      [2, 258],   [2, 261],   [2, 267],   [2, 274],   [2, 282],
      [2, 284],   [3, 1],   [3, 10],  [3, 21],  [3, 31],
      [3, 42],  [3, 55],  [3, 64],  [3, 72],  [3, 81],
      [3, 92],  [3, 102],   [3, 110],   [3, 121],   [3, 130],
      [3, 144],   [3, 149],   [3, 156],   [3, 172],   [3, 181],
      [3, 190],   [4, 1],   [4, 11],  [4, 15],  [4, 23],
      [4, 26],  [4, 34],  [4, 43],  [4, 51],  [4, 60],
      [4, 71],  [4, 77],  [4, 88],  [4, 92],  [4, 97],
      [4, 101],   [4, 105],   [4, 113],   [4, 116],   [4, 127],
      [4, 135],   [4, 142],   [4, 153],   [4, 163],   [4, 172],
      [5, 1],   [5, 6],   [5, 12],  [5, 20],  [5, 27],
      [5, 35],  [5, 44],  [5, 51],  [5, 57],  [5, 67],
      [5, 78],  [5, 87],  [5, 94],  [5, 101],   [5, 109],
      [5, 116],   [6, 1],   [6, 11],  [6, 21],  [6, 31],
      [6, 42],  [6, 51],  [6, 56],  [6, 61],  [6, 71],
      [6, 83],  [6, 91],  [6, 95],  [6, 101],   [6, 111],
      [6, 122],   [6, 130],   [6, 141],   [6, 145],   [6, 151],
      [6, 155],   [7, 1],   [7, 11],  [7, 26],  [7, 32],
      [7, 40],  [7, 48],  [7, 54],  [7, 59],  [7, 65],
      [7, 73],  [7, 85],  [7, 94],  [7, 100],   [7, 109],
      [7, 127],   [7, 130],   [7, 142],   [7, 148],   [7, 152],
      [7, 158],   [7, 163],   [7, 172],   [7, 182],   [7, 189],
      [8, 1],   [8, 11],  [8, 20],  [8, 29],  [8, 38],
      [8, 45],  [8, 49],  [8, 59],  [8, 65],  [8, 70],
      [9, 1],   [9, 7],   [9, 17],  [9, 25],  [9, 30],
      [9, 38],  [9, 43],  [9, 60],  [9, 67],  [9, 73],
      [9, 81],  [9, 90],  [9, 100],   [9, 111],   [9, 119],
      [9, 123],   [10, 1],  [10, 11],   [10, 21],   [10, 31],
      [10, 41],   [10, 54],   [10, 61],   [10, 71],   [10, 83],
      [10, 93],   [10, 104],  [11, 1],  [11, 9],  [11, 25],
      [11, 36],   [11, 50],   [11, 61],   [11, 69],   [11, 84],
      [11, 96],   [11, 110],  [12, 1],  [12, 7],  [12, 21],
      [12, 30],   [12, 36],   [12, 43],   [12, 50],   [12, 58],
      [12, 69],   [12, 80],   [12, 94],   [12, 105],  [13, 1],
      [13, 8],  [13, 19],   [13, 27],   [13, 32],   [13, 38],
      [14, 1],  [14, 7],  [14, 13],   [14, 22],   [14, 28],
      [14, 35],   [14, 42],   [15, 1],  [15, 16],   [15, 26],
      [15, 45],   [15, 61],   [15, 80],   [16, 1],  [16, 10],
      [16, 22],   [16, 26],   [16, 35],   [16, 41],   [16, 51],
      [16, 61],   [16, 66],   [16, 71],   [16, 77],   [16, 84],
      [16, 90],   [16, 101],  [16, 111],  [16, 120],  [17, 1],
      [17, 11],   [17, 23],   [17, 31],   [17, 41],   [17, 53],
      [17, 61],   [17, 71],   [17, 78],   [17, 85],   [17, 94],
      [17, 101],  [18, 1],  [18, 13],   [18, 18],   [18, 23],
      [18, 32],   [18, 45],   [18, 50],   [18, 54],   [18, 60],
      [18, 71],   [18, 83],   [18, 102],  [19, 1],  [19, 16],
      [19, 41],   [19, 51],   [19, 66],   [19, 83],   [20, 1],
      [20, 25],   [20, 55],   [20, 77],   [20, 90],   [20, 105],
      [20, 116],  [20, 129],  [21, 1],  [21, 11],   [21, 30],
      [21, 42],   [21, 51],   [21, 76],   [21, 94],   [22, 1],
      [22, 11],   [22, 23],   [22, 26],   [22, 34],   [22, 39],
      [22, 49],   [22, 58],   [22, 65],   [22, 73],   [23, 1],
      [23, 23],   [23, 33],   [23, 51],   [23, 78],   [23, 93],
      [24, 1],  [24, 11],   [24, 21],   [24, 27],   [24, 35],
      [24, 41],   [24, 51],   [24, 58],   [24, 62],   [25, 1],
      [25, 10],   [25, 21],   [25, 35],   [25, 45],   [25, 61],
      [26, 1],  [26, 10],   [26, 34],   [26, 53],   [26, 70],
      [26, 105],  [26, 123],  [26, 141],  [26, 160],  [26, 176],
      [26, 192],  [27, 1],  [27, 15],   [27, 32],   [27, 45],
      [27, 59],   [27, 67],   [27, 83],   [28, 1],  [28, 14],
      [28, 22],   [28, 29],   [28, 43],   [28, 51],   [28, 61],
      [28, 76],   [29, 1],  [29, 14],   [29, 23],   [29, 31],
      [29, 45],   [29, 52],   [29, 64],   [30, 1],  [30, 11],
      [30, 20],   [30, 28],   [30, 41],   [30, 54],   [31, 1],
      [31, 12],   [31, 20],   [32, 1],  [32, 12],   [32, 23],
      [33, 1],  [33, 9],  [33, 21],   [33, 28],   [33, 35],
      [33, 41],   [33, 53],   [33, 59],   [33, 69],   [34, 1],
      [34, 10],   [34, 22],   [34, 31],   [34, 37],   [34, 46],
      [35, 1],  [35, 8],  [35, 15],   [35, 27],   [35, 38],
      [36, 1],  [36, 13],   [36, 33],   [36, 51],   [36, 68],
      [37, 1],  [37, 22],   [37, 75],   [37, 114],  [37, 139],
      [38, 1],  [38, 15],   [38, 27],   [38, 41],   [38, 65],
      [39, 1],  [39, 10],   [39, 22],   [39, 32],   [39, 42],
      [39, 53],   [39, 64],   [39, 71],   [40, 1],  [40, 10],
      [40, 21],   [40, 28],   [40, 38],   [40, 51],   [40, 61],
      [40, 69],   [40, 79],   [41, 1],  [41, 9],  [41, 19],
      [41, 26],   [41, 33],   [41, 45],   [42, 1],  [42, 10],
      [42, 20],   [42, 30],   [42, 44],   [43, 1],  [43, 16],
      [43, 26],   [43, 36],   [43, 46],   [43, 57],   [43, 68],
      [44, 1],  [44, 30],   [44, 43],   [45, 1],  [45, 12],
      [45, 22],   [45, 27],   [46, 1],  [46, 11],   [46, 21],
      [46, 27],   [47, 1],  [47, 12],   [47, 20],   [47, 29],
      [48, 1],  [48, 11],   [48, 18],   [48, 27],   [49, 1],
      [49, 11],   [50, 1],  [50, 16],   [50, 30],   [51, 1],
      [51, 24],   [51, 47],   [52, 1],  [52, 29],   [53, 1],
      [53, 26],   [53, 33],   [54, 1],  [54, 23],   [54, 41],
      [55, 1],  [55, 26],   [55, 46],   [56, 1],  [56, 39],
      [56, 75],   [57, 1],  [57, 11],   [57, 20],   [57, 26],
      [58, 1],  [58, 7],  [58, 14],   [59, 1],  [59, 11],
      [59, 18],   [60, 1],  [60, 7],  [61, 1],  [61, 10],
      [62, 1],  [62, 9],  [63, 1],  [63, 9],  [64, 1],
      [64, 11],   [65, 1],  [65, 8],  [66, 1],  [66, 8],
      [67, 1],  [67, 15],   [68, 1],  [68, 34],   [69, 1],
      [69, 38],   [70, 1],  [70, 36],   [71, 1],  [71, 21],
      [72, 1],  [72, 20],   [73, 1],  [73, 20],   [74, 1],
      [74, 32],   [75, 1],  [75, 31],   [76, 1],  [76, 23],
      [77, 1],  [77, 41],   [78, 1],  [78, 31],   [79, 1],
      [79, 27],   [80, 1],  [81, 1],  [82, 1],  [83, 1],
      [84, 1],  [85, 1],  [86, 1],  [87, 1],  [88, 1],
      [89, 1],  [90, 1],  [91, 1],  [92, 1],  [93, 1],
      [94, 1],  [95, 1],  [96, 1],  [97, 1],  [98, 1],
      [99, 1],  [100, 1],   [101, 1],   [102, 1],   [103, 1],
      [104, 1],   [105, 1],   [106, 1],   [107, 1],   [108, 1],
      [109, 1],   [110, 1],   [111, 1],   [112, 1],   [113, 1],
      [114, 1]
    ];


    //------------------ Page Data ---------------------

    QuranData.Page = [
      // [sura, aya]
      [],
      [1, 1],   [2, 1],   [2, 6],   [2, 17],  [2, 25],
      [2, 30],  [2, 38],  [2, 49],  [2, 58],  [2, 62],
      [2, 70],  [2, 77],  [2, 84],  [2, 89],  [2, 94],
      [2, 102],   [2, 106],   [2, 113],   [2, 120],   [2, 127],
      [2, 135],   [2, 142],   [2, 146],   [2, 154],   [2, 164],
      [2, 170],   [2, 177],   [2, 182],   [2, 187],   [2, 191],
      [2, 197],   [2, 203],   [2, 211],   [2, 216],   [2, 220],
      [2, 225],   [2, 231],   [2, 234],   [2, 238],   [2, 246],
      [2, 249],   [2, 253],   [2, 257],   [2, 260],   [2, 265],
      [2, 270],   [2, 275],   [2, 282],   [2, 283],   [3, 1],
      [3, 10],  [3, 16],  [3, 23],  [3, 30],  [3, 38],
      [3, 46],  [3, 53],  [3, 62],  [3, 71],  [3, 78],
      [3, 84],  [3, 92],  [3, 101],   [3, 109],   [3, 116],
      [3, 122],   [3, 133],   [3, 141],   [3, 149],   [3, 154],
      [3, 158],   [3, 166],   [3, 174],   [3, 181],   [3, 187],
      [3, 195],   [4, 1],   [4, 7],   [4, 12],  [4, 15],
      [4, 20],  [4, 24],  [4, 27],  [4, 34],  [4, 38],
      [4, 45],  [4, 52],  [4, 60],  [4, 66],  [4, 75],
      [4, 80],  [4, 87],  [4, 92],  [4, 95],  [4, 102],
      [4, 106],   [4, 114],   [4, 122],   [4, 128],   [4, 135],
      [4, 141],   [4, 148],   [4, 155],   [4, 163],   [4, 171],
      [4, 176],   [5, 3],   [5, 6],   [5, 10],  [5, 14],
      [5, 18],  [5, 24],  [5, 32],  [5, 37],  [5, 42],
      [5, 46],  [5, 51],  [5, 58],  [5, 65],  [5, 71],
      [5, 77],  [5, 83],  [5, 90],  [5, 96],  [5, 104],
      [5, 109],   [5, 114],   [6, 1],   [6, 9],   [6, 19],
      [6, 28],  [6, 36],  [6, 45],  [6, 53],  [6, 60],
      [6, 69],  [6, 74],  [6, 82],  [6, 91],  [6, 95],
      [6, 102],   [6, 111],   [6, 119],   [6, 125],   [6, 132],
      [6, 138],   [6, 143],   [6, 147],   [6, 152],   [6, 158],
      [7, 1],   [7, 12],  [7, 23],  [7, 31],  [7, 38],
      [7, 44],  [7, 52],  [7, 58],  [7, 68],  [7, 74],
      [7, 82],  [7, 88],  [7, 96],  [7, 105],   [7, 121],
      [7, 131],   [7, 138],   [7, 144],   [7, 150],   [7, 156],
      [7, 160],   [7, 164],   [7, 171],   [7, 179],   [7, 188],
      [7, 196],   [8, 1],   [8, 9],   [8, 17],  [8, 26],
      [8, 34],  [8, 41],  [8, 46],  [8, 53],  [8, 62],
      [8, 70],  [9, 1],   [9, 7],   [9, 14],  [9, 21],
      [9, 27],  [9, 32],  [9, 37],  [9, 41],  [9, 48],
      [9, 55],  [9, 62],  [9, 69],  [9, 73],  [9, 80],
      [9, 87],  [9, 94],  [9, 100],   [9, 107],   [9, 112],
      [9, 118],   [9, 123],   [10, 1],  [10, 7],  [10, 15],
      [10, 21],   [10, 26],   [10, 34],   [10, 43],   [10, 54],
      [10, 62],   [10, 71],   [10, 79],   [10, 89],   [10, 98],
      [10, 107],  [11, 6],  [11, 13],   [11, 20],   [11, 29],
      [11, 38],   [11, 46],   [11, 54],   [11, 63],   [11, 72],
      [11, 82],   [11, 89],   [11, 98],   [11, 109],  [11, 118],
      [12, 5],  [12, 15],   [12, 23],   [12, 31],   [12, 38],
      [12, 44],   [12, 53],   [12, 64],   [12, 70],   [12, 79],
      [12, 87],   [12, 96],   [12, 104],  [13, 1],  [13, 6],
      [13, 14],   [13, 19],   [13, 29],   [13, 35],   [13, 43],
      [14, 6],  [14, 11],   [14, 19],   [14, 25],   [14, 34],
      [14, 43],   [15, 1],  [15, 16],   [15, 32],   [15, 52],
      [15, 71],   [15, 91],   [16, 7],  [16, 15],   [16, 27],
      [16, 35],   [16, 43],   [16, 55],   [16, 65],   [16, 73],
      [16, 80],   [16, 88],   [16, 94],   [16, 103],  [16, 111],
      [16, 119],  [17, 1],  [17, 8],  [17, 18],   [17, 28],
      [17, 39],   [17, 50],   [17, 59],   [17, 67],   [17, 76],
      [17, 87],   [17, 97],   [17, 105],  [18, 5],  [18, 16],
      [18, 21],   [18, 28],   [18, 35],   [18, 46],   [18, 54],
      [18, 62],   [18, 75],   [18, 84],   [18, 98],   [19, 1],
      [19, 12],   [19, 26],   [19, 39],   [19, 52],   [19, 65],
      [19, 77],   [19, 96],   [20, 13],   [20, 38],   [20, 52],
      [20, 65],   [20, 77],   [20, 88],   [20, 99],   [20, 114],
      [20, 126],  [21, 1],  [21, 11],   [21, 25],   [21, 36],
      [21, 45],   [21, 58],   [21, 73],   [21, 82],   [21, 91],
      [21, 102],  [22, 1],  [22, 6],  [22, 16],   [22, 24],
      [22, 31],   [22, 39],   [22, 47],   [22, 56],   [22, 65],
      [22, 73],   [23, 1],  [23, 18],   [23, 28],   [23, 43],
      [23, 60],   [23, 75],   [23, 90],   [23, 105],  [24, 1],
      [24, 11],   [24, 21],   [24, 28],   [24, 32],   [24, 37],
      [24, 44],   [24, 54],   [24, 59],   [24, 62],   [25, 3],
      [25, 12],   [25, 21],   [25, 33],   [25, 44],   [25, 56],
      [25, 68],   [26, 1],  [26, 20],   [26, 40],   [26, 61],
      [26, 84],   [26, 112],  [26, 137],  [26, 160],  [26, 184],
      [26, 207],  [27, 1],  [27, 14],   [27, 23],   [27, 36],
      [27, 45],   [27, 56],   [27, 64],   [27, 77],   [27, 89],
      [28, 6],  [28, 14],   [28, 22],   [28, 29],   [28, 36],
      [28, 44],   [28, 51],   [28, 60],   [28, 71],   [28, 78],
      [28, 85],   [29, 7],  [29, 15],   [29, 24],   [29, 31],
      [29, 39],   [29, 46],   [29, 53],   [29, 64],   [30, 6],
      [30, 16],   [30, 25],   [30, 33],   [30, 42],   [30, 51],
      [31, 1],  [31, 12],   [31, 20],   [31, 29],   [32, 1],
      [32, 12],   [32, 21],   [33, 1],  [33, 7],  [33, 16],
      [33, 23],   [33, 31],   [33, 36],   [33, 44],   [33, 51],
      [33, 55],   [33, 63],   [34, 1],  [34, 8],  [34, 15],
      [34, 23],   [34, 32],   [34, 40],   [34, 49],   [35, 4],
      [35, 12],   [35, 19],   [35, 31],   [35, 39],   [35, 45],
      [36, 13],   [36, 28],   [36, 41],   [36, 55],   [36, 71],
      [37, 1],  [37, 25],   [37, 52],   [37, 77],   [37, 103],
      [37, 127],  [37, 154],  [38, 1],  [38, 17],   [38, 27],
      [38, 43],   [38, 62],   [38, 84],   [39, 6],  [39, 11],
      [39, 22],   [39, 32],   [39, 41],   [39, 48],   [39, 57],
      [39, 68],   [39, 75],   [40, 8],  [40, 17],   [40, 26],
      [40, 34],   [40, 41],   [40, 50],   [40, 59],   [40, 67],
      [40, 78],   [41, 1],  [41, 12],   [41, 21],   [41, 30],
      [41, 39],   [41, 47],   [42, 1],  [42, 11],   [42, 16],
      [42, 23],   [42, 32],   [42, 45],   [42, 52],   [43, 11],
      [43, 23],   [43, 34],   [43, 48],   [43, 61],   [43, 74],
      [44, 1],  [44, 19],   [44, 40],   [45, 1],  [45, 14],
      [45, 23],   [45, 33],   [46, 6],  [46, 15],   [46, 21],
      [46, 29],   [47, 1],  [47, 12],   [47, 20],   [47, 30],
      [48, 1],  [48, 10],   [48, 16],   [48, 24],   [48, 29],
      [49, 5],  [49, 12],   [50, 1],  [50, 16],   [50, 36],
      [51, 7],  [51, 31],   [51, 52],   [52, 15],   [52, 32],
      [53, 1],  [53, 27],   [53, 45],   [54, 7],  [54, 28],
      [54, 50],   [55, 17],   [55, 41],   [55, 68],   [56, 17],
      [56, 51],   [56, 77],   [57, 4],  [57, 12],   [57, 19],
      [57, 25],   [58, 1],  [58, 7],  [58, 12],   [58, 22],
      [59, 4],  [59, 10],   [59, 17],   [60, 1],  [60, 6],
      [60, 12],   [61, 6],  [62, 1],  [62, 9],  [63, 5],
      [64, 1],  [64, 10],   [65, 1],  [65, 6],  [66, 1],
      [66, 8],  [67, 1],  [67, 13],   [67, 27],   [68, 16],
      [68, 43],   [69, 9],  [69, 35],   [70, 11],   [70, 40],
      [71, 11],   [72, 1],  [72, 14],   [73, 1],  [73, 20],
      [74, 18],   [74, 48],   [75, 20],   [76, 6],  [76, 26],
      [77, 20],   [78, 1],  [78, 31],   [79, 16],   [80, 1],
      [81, 1],  [82, 1],  [83, 7],  [83, 35],   [85, 1],
      [86, 1],  [87, 16],   [89, 1],  [89, 24],   [91, 1],
      [92, 15],   [95, 1],  [97, 1],  [98, 8],  [100, 10],
      [103, 1],   [106, 1],   [109, 1],   [112, 1],   [115, 1]
    ];


    //------------------ Sajda Data ---------------------

    QuranData.Sajda = [
      // [sura, aya, type]
      [],
      [7, 206, 'recommended'],
      [13, 15, 'recommended'],
      [16, 50, 'recommended'],
      [17, 109, 'recommended'],
      [19, 58, 'recommended'],
      [22, 18, 'recommended'],
      [22, 77, 'recommended'],
      [25, 60, 'recommended'],
      [27, 26, 'recommended'],
      [32, 15, 'obligatory'],
      [38, 24, 'recommended'],
      [41, 38, 'obligatory'],
      [53, 62, 'obligatory'],
      [84, 21, 'recommended'],
      [96, 19, 'obligatory'],
    ];

    // Options
    var Options = {
      type: [{"key":"simple","value":"Simple"},{"key":"simple-enhanced","value":"Simple (Enhanced)"},{"key":"simple-min","value":"Simple (Minimal)"},{"key":"simple-clean","value":"Simple (Clean)"},{"key":"uthmani","value":"Uthmani"},{"key":"uthmani-min","value":"Uthmani (Minimal)"}],

      trans: [ {"lang":"Albanian","name":"Efendi Nahi","translator":"Hasan Efendi Nahi","link":"http://tanzil.net/trans/sq.nahi","id":"sq.nahi"},
               {"lang":"Albanian","name":"Feti Mehdiu","translator":"Feti Mehdiu","link":"http://tanzil.net/trans/sq.mehdiu","id":"sq.mehdiu"},
               {"lang":"Albanian","name":"Sherif Ahmeti","translator":"Sherif Ahmeti","link":"http://tanzil.net/trans/sq.ahmeti","id":"sq.ahmeti"},
               {"lang":"Amazigh","name":"At Mensur","translator":"Ramdane At Mansour *","link":"http://tanzil.net/trans/ber.mensur","id":"ber.mensur"},
               {"lang":"Arabic","name":"تفسير الجلالين","translator":"Jalal ad-Din al-Mahalli and Jalal ad-Din as-Suyuti *","link":"http://tanzil.net/trans/ar.jalalayn","id":"ar.jalalayn"},
               {"lang":"Arabic","name":"تفسير المیسر","translator":"King Fahad Quran Complex *","link":"http://tanzil.net/trans/ar.muyassar","id":"ar.muyassar"},
               {"lang":"Amharic ","name":"ሳዲቅ & ሳኒ ሐቢብ","translator":"Muhammed Sadiq and Muhammed Sani Habib *","link":"http://tanzil.net/trans/am.sadiq","id":"am.sadiq"},
               {"lang":"Azerbaijani","name":"Məmmədəliyev & Bünyadov","translator":"Vasim Mammadaliyev and Ziya Bunyadov *","link":"http://tanzil.net/trans/az.mammadaliyev","id":"az.mammadaliyev"},
               {"lang":"Azerbaijani","name":"Musayev","translator":"Alikhan Musayev","link":"http://tanzil.net/trans/az.musayev","id":"az.musayev"},
               {"lang":"Bengali","name":"জহুরুল হক","translator":"Zohurul Hoque *","link":"http://tanzil.net/trans/bn.hoque","id":"bn.hoque"},
               {"lang":"Bengali","name":"মুহিউদ্দীন খান","translator":"Muhiuddin Khan","link":"http://tanzil.net/trans/bn.bengali","id":"bn.bengali"},
               {"lang":"Bosnian","name":"Korkut","translator":"Besim Korkut *","link":"http://tanzil.net/trans/bs.korkut","id":"bs.korkut"},
               {"lang":"Bosnian","name":"Mlivo","translator":"Mustafa Mlivo","link":"http://tanzil.net/trans/bs.mlivo","id":"bs.mlivo"},
               {"lang":"Bulgarian","name":"Теофанов","translator":"Tzvetan Theophanov","link":"http://tanzil.net/trans/bg.theophanov","id":"bg.theophanov"},
               {"lang":"Chinese","name":"Ma Jian","translator":"Ma Jian","link":"http://tanzil.net/trans/zh.jian","id":"zh.jian"},
               {"lang":"Chinese","name":"Ma Jian (Traditional)","translator":"Ma Jian","link":"http://tanzil.net/trans/zh.majian","id":"zh.majian"},
               {"lang":"Czech","name":"Hrbek","translator":"Preklad I. Hrbek","link":"http://tanzil.net/trans/cs.hrbek","id":"cs.hrbek"},
               {"lang":"Czech","name":"Nykl","translator":"A. R. Nykl","link":"http://tanzil.net/trans/cs.nykl","id":"cs.nykl"},
               {"lang":"Divehi","name":"ދިވެހި","translator":"Office of the President of Maldives","link":"http://tanzil.net/trans/dv.divehi","id":"dv.divehi"},
               {"lang":"Dutch","name":"Keyzer","translator":"Salomo Keyzer ","link":"http://tanzil.net/trans/nl.keyzer","id":"nl.keyzer"},
               {"lang":"Dutch","name":"Leemhuis","translator":"Fred Leemhuis","link":"http://tanzil.net/trans/nl.leemhuis","id":"nl.leemhuis"},
               {"lang":"Dutch","name":"Siregar","translator":"Sofian S. Siregar","link":"http://tanzil.net/trans/nl.siregar","id":"nl.siregar"},
               {"lang":"English","name":"Ahmed Ali","translator":"Ahmed Ali *","link":"http://tanzil.net/trans/en.ahmedali","id":"en.ahmedali"},
               {"lang":"English","name":"Ahmed Raza Khan","translator":"Ahmed Raza Khan *","link":"http://tanzil.net/trans/en.ahmedraza","id":"en.ahmedraza"},
               {"lang":"English","name":"Arberry","translator":"A. J. Arberry *","link":"http://tanzil.net/trans/en.arberry","id":"en.arberry"},
               {"lang":"English","name":"Daryabadi","translator":"Abdul Majid Daryabadi *","link":"http://tanzil.net/trans/en.daryabadi","id":"en.daryabadi"},
               {"lang":"English","name":"Hilali & Khan","translator":"Muhammad Taqi-ud-Din al-Hilali and Muhammad Muhsin Khan *","link":"http://tanzil.net/trans/en.hilali","id":"en.hilali"},
               {"lang":"English","name":"Itani","translator":"Talal Itani","link":"http://tanzil.net/trans/en.itani","id":"en.itani"},
               {"lang":"English","name":"Maududi","translator":"Abul Ala Maududi *","link":"http://tanzil.net/trans/en.maududi","id":"en.maududi"},
               {"lang":"English","name":"Mubarakpuri","translator":"Safi-ur-Rahman al-Mubarakpuri *","link":"http://tanzil.net/trans/en.mubarakpuri","id":"en.mubarakpuri"},
               {"lang":"English","name":"Pickthall","translator":"Mohammed Marmaduke William Pickthall *","link":"http://tanzil.net/trans/en.pickthall","id":"en.pickthall"},
               {"lang":"English","name":"Qarai","translator":"Ali Quli Qarai","link":"http://tanzil.net/trans/en.qarai","id":"en.qarai"},
               {"lang":"English","name":"Qaribullah & Darwish","translator":"Hasan al-Fatih Qaribullah and Ahmad Darwish","link":"http://tanzil.net/trans/en.qaribullah","id":"en.qaribullah"},
               {"lang":"English","name":"Saheeh International","translator":"Saheeh International *","link":"http://tanzil.net/trans/en.sahih","id":"en.sahih"},
               {"lang":"English","name":"Sarwar","translator":"Muhammad Sarwar *","link":"http://tanzil.net/trans/en.sarwar","id":"en.sarwar"},
               {"lang":"English","name":"Shakir","translator":"Mohammad Habib Shakir *","link":"http://tanzil.net/trans/en.shakir","id":"en.shakir"},
               {"lang":"English","name":"Transliteration","translator":"English Transliteration","link":"http://tanzil.net/trans/en.transliteration","id":"en.transliteration"},
               {"lang":"English","name":"Wahiduddin Khan","translator":"Wahiduddin Khan *","link":"http://tanzil.net/trans/en.wahiduddin","id":"en.wahiduddin"},
               {"lang":"English","name":"Yusuf Ali","translator":"Abdullah Yusuf Ali *","link":"http://tanzil.net/trans/en.yusufali","id":"en.yusufali"},
               {"lang":"French","name":"Hamidullah","translator":"Muhammad Hamidullah *","link":"http://tanzil.net/trans/fr.hamidullah","id":"fr.hamidullah"},
               {"lang":"German","name":"Abu Rida","translator":"Abu Rida Muhammad ibn Ahmad ibn Rassoul","link":"http://tanzil.net/trans/de.aburida","id":"de.aburida"},
               {"lang":"German","name":"Bubenheim & Elyas","translator":"A. S. F. Bubenheim and N. Elyas *","link":"http://tanzil.net/trans/de.bubenheim","id":"de.bubenheim"},
               {"lang":"German","name":"Khoury","translator":"Adel Theodor Khoury *","link":"http://tanzil.net/trans/de.khoury","id":"de.khoury"},
               {"lang":"German","name":"Zaidan","translator":"Amir Zaidan","link":"http://tanzil.net/trans/de.zaidan","id":"de.zaidan"},
               {"lang":"Hausa","name":"Gumi","translator":"Abubakar Mahmoud Gumi","link":"http://tanzil.net/trans/ha.gumi","id":"ha.gumi"},
               {"lang":"Hindi","name":"फ़ारूक़ ख़ान & अहमद","translator":"Muhammad Farooq Khan and Muhammad Ahmed  ","link":"http://tanzil.net/trans/hi.farooq","id":"hi.farooq"},
               {"lang":"Hindi","name":"फ़ारूक़ ख़ान & नदवी","translator":"Suhel Farooq Khan and Saifur Rahman Nadwi","link":"http://tanzil.net/trans/hi.hindi","id":"hi.hindi"},
               {"lang":"Indonesian","name":"Bahasa Indonesia","translator":"Indonesian Ministry of Religious Affairs","link":"http://tanzil.net/trans/id.indonesian","id":"id.indonesian"},
               {"lang":"Indonesian","name":"Quraish Shihab","translator":"Muhammad Quraish Shihab et al. *","link":"http://tanzil.net/trans/id.muntakhab","id":"id.muntakhab"},
               {"lang":"Indonesian","name":"Tafsir Jalalayn","translator":"Jalal ad-Din al-Mahalli and Jalal ad-Din as-Suyuti *","link":"http://tanzil.net/trans/id.jalalayn","id":"id.jalalayn"},
               {"lang":"Italian","name":"Piccardo","translator":"Hamza Roberto Piccardo *","link":"http://tanzil.net/trans/it.piccardo","id":"it.piccardo"},
               {"lang":"Japanese","name":"Japanese","translator":"Unknown","link":"http://tanzil.net/trans/ja.japanese","id":"ja.japanese"},
               {"lang":"Korean","name":"Korean","translator":"Unknown","link":"http://tanzil.net/trans/ko.korean","id":"ko.korean"},
               {"lang":"Kurdish","name":"ته‌فسیری ئاسان","translator":"Burhan Muhammad-Amin","link":"http://tanzil.net/trans/ku.asan","id":"ku.asan"},
               {"lang":"Malay","name":"Basmeih","translator":"Abdullah Muhammad Basmeih","link":"http://tanzil.net/trans/ms.basmeih","id":"ms.basmeih"},
               {"lang":"Malayalam","name":"അബ്ദുല്‍ ഹമീദ് & പറപ്പൂര്‍","translator":"Cheriyamundam Abdul Hameed and Kunhi Mohammed Parappoor","link":"http://tanzil.net/trans/ml.abdulhameed","id":"ml.abdulhameed"},
               {"lang":"Malayalam","name":"കാരകുന്ന് & എളയാവൂര്","translator":"Muhammad Karakunnu and Vanidas Elayavoor *","link":"http://tanzil.net/trans/ml.karakunnu","id":"ml.karakunnu"},
               {"lang":"Norwegian","name":"Einar Berg","translator":"Einar Berg","link":"http://tanzil.net/trans/no.berg","id":"no.berg"},
               {"lang":"Persian","name":"الهی قمشه‌ای","translator":"Mahdi Elahi Ghomshei *","link":"http://tanzil.net/trans/fa.ghomshei","id":"fa.ghomshei"},
               {"lang":"Persian","name":"انصاریان","translator":"Hussain Ansarian *","link":"http://tanzil.net/trans/fa.ansarian","id":"fa.ansarian"},
               {"lang":"Persian","name":"آیتی","translator":"AbdolMohammad Ayati *","link":"http://tanzil.net/trans/fa.ayati","id":"fa.ayati"},
               {"lang":"Persian","name":"بهرام پور","translator":"Abolfazl Bahrampour *","link":"http://tanzil.net/trans/fa.bahrampour","id":"fa.bahrampour"},
               {"lang":"Persian","name":"خرمدل","translator":"Mostafa Khorramdel *","link":"http://tanzil.net/trans/fa.khorramdel","id":"fa.khorramdel"},
               {"lang":"Persian","name":"خرمشاهی","translator":"Baha'oddin Khorramshahi *","link":"http://tanzil.net/trans/fa.khorramshahi","id":"fa.khorramshahi"},
               {"lang":"Persian","name":"صادقی تهرانی","translator":"Mohammad Sadeqi Tehrani *","link":"http://tanzil.net/trans/fa.sadeqi","id":"fa.sadeqi"},
               {"lang":"Persian","name":"فولادوند","translator":"Mohammad Mahdi Fooladvand *","link":"http://tanzil.net/trans/fa.fooladvand","id":"fa.fooladvand"},
               {"lang":"Persian","name":"مجتبوی","translator":"Sayyed Jalaloddin Mojtabavi *","link":"http://tanzil.net/trans/fa.mojtabavi","id":"fa.mojtabavi"},
               {"lang":"Persian","name":"معزی","translator":"Mohammad Kazem Moezzi","link":"http://tanzil.net/trans/fa.moezzi","id":"fa.moezzi"},
               {"lang":"Persian","name":"مکارم شیرازی","translator":"Naser Makarem Shirazi *","link":"http://tanzil.net/trans/fa.makarem","id":"fa.makarem"},
               {"lang":"Polish","name":"Bielawskiego","translator":"Józefa Bielawskiego","link":"http://tanzil.net/trans/pl.bielawskiego","id":"pl.bielawskiego"},
               {"lang":"Portuguese","name":"El-Hayek","translator":"Samir El-Hayek ","link":"http://tanzil.net/trans/pt.elhayek","id":"pt.elhayek"},
               {"lang":"Romanian","name":"Grigore","translator":"George Grigore","link":"http://tanzil.net/trans/ro.grigore","id":"ro.grigore"},
               {"lang":"Russian","name":"Абу Адель","translator":"Abu Adel","link":"http://tanzil.net/trans/ru.abuadel","id":"ru.abuadel"},
               {"lang":"Russian","name":"Аль-Мунтахаб","translator":"Ministry of Awqaf, Egypt","link":"http://tanzil.net/trans/ru.muntahab","id":"ru.muntahab"},
               {"lang":"Russian","name":"Крачковский","translator":"Ignaty Yulianovich Krachkovsky *","link":"http://tanzil.net/trans/ru.krachkovsky","id":"ru.krachkovsky"},
               {"lang":"Russian","name":"Кулиев","translator":"Elmir Kuliev","link":"http://tanzil.net/trans/ru.kuliev","id":"ru.kuliev"},
               {"lang":"Russian","name":"Кулиев + ас-Саади","translator":"Elmir Kuliev (with Abd ar-Rahman as-Saadi's commentaries)","link":"http://tanzil.net/trans/ru.kuliev-alsaadi","id":"ru.kuliev-alsaadi"},
               {"lang":"Russian","name":"Османов","translator":"Magomed-Nuri Osmanovich Osmanov","link":"http://tanzil.net/trans/ru.osmanov","id":"ru.osmanov"},
               {"lang":"Russian","name":"Порохова","translator":"V. Porokhova","link":"http://tanzil.net/trans/ru.porokhova","id":"ru.porokhova"},
               {"lang":"Russian","name":"Саблуков","translator":"Gordy Semyonovich Sablukov","link":"http://tanzil.net/trans/ru.sablukov","id":"ru.sablukov"},
               {"lang":"Sindhi","name":"امروٽي","translator":"Taj Mehmood Amroti","link":"http://tanzil.net/trans/sd.amroti","id":"sd.amroti"},
               {"lang":"Somali","name":"Abduh","translator":"Mahmud Muhammad Abduh","link":"http://tanzil.net/trans/so.abduh","id":"so.abduh"},
               {"lang":"Spanish","name":"Bornez","translator":"Raúl González Bórnez *","link":"http://tanzil.net/trans/es.bornez","id":"es.bornez"},
               {"lang":"Spanish","name":"Cortes","translator":"Julio Cortes ","link":"http://tanzil.net/trans/es.cortes","id":"es.cortes"},
               {"lang":"Spanish","name":"Garcia","translator":"Muhammad Isa García *","link":"http://tanzil.net/trans/es.garcia","id":"es.garcia"},
               {"lang":"Swahili","name":"Al-Barwani","translator":"Ali Muhsin Al-Barwani","link":"http://tanzil.net/trans/sw.barwani","id":"sw.barwani"},
               {"lang":"Swedish","name":"Bernström","translator":"Knut Bernström","link":"http://tanzil.net/trans/sv.bernstrom","id":"sv.bernstrom"},
               {"lang":"Tajik","name":"Оятӣ","translator":"AbdolMohammad Ayati","link":"http://tanzil.net/trans/tg.ayati","id":"tg.ayati"},
               {"lang":"Tamil","name":"ஜான் டிரஸ்ட்","translator":"Jan Turst Foundation","link":"http://tanzil.net/trans/ta.tamil","id":"ta.tamil"},
               {"lang":"Tatar","name":"Yakub Ibn Nugman","translator":"Yakub Ibn Nugman","link":"http://tanzil.net/trans/tt.nugman","id":"tt.nugman"},
               {"lang":"Thai","name":"ภาษาไทย","translator":"King Fahad Quran Complex","link":"http://tanzil.net/trans/th.thai","id":"th.thai"},
               {"lang":"Turkish","name":"Abdulbakî Gölpınarlı","translator":"Abdulbaki Golpinarli","link":"http://tanzil.net/trans/tr.golpinarli","id":"tr.golpinarli"},
               {"lang":"Turkish","name":"Alİ Bulaç","translator":"Alİ Bulaç","link":"http://tanzil.net/trans/tr.bulac","id":"tr.bulac"},
               {"lang":"Turkish","name":"Çeviriyazı","translator":"Muhammet Abay","link":"http://tanzil.net/trans/tr.transliteration","id":"tr.transliteration"},
               {"lang":"Turkish","name":"Diyanet İşleri","translator":"Diyanet Isleri","link":"http://tanzil.net/trans/tr.diyanet","id":"tr.diyanet"},
               {"lang":"Turkish","name":"Diyanet Vakfı","translator":"Diyanet Vakfi","link":"http://tanzil.net/trans/tr.vakfi","id":"tr.vakfi"},
               {"lang":"Turkish","name":"Edip Yüksel","translator":"Edip Yüksel","link":"http://tanzil.net/trans/tr.yuksel","id":"tr.yuksel"},
               {"lang":"Turkish","name":"Elmalılı Hamdi Yazır","translator":"Elmalili Hamdi Yazir","link":"http://tanzil.net/trans/tr.yazir","id":"tr.yazir"},
               {"lang":"Turkish","name":"Öztürk","translator":"Yasar Nuri Ozturk *","link":"http://tanzil.net/trans/tr.ozturk","id":"tr.ozturk"},
               {"lang":"Turkish","name":"Suat Yıldırım","translator":"Suat Yildirim","link":"http://tanzil.net/trans/tr.yildirim","id":"tr.yildirim"},
               {"lang":"Turkish","name":"Süleyman Ateş","translator":"Suleyman Ates","link":"http://tanzil.net/trans/tr.ates","id":"tr.ates"},
               {"lang":"Urdu","name":"ابوالاعلی مودودی","translator":"Abul A'ala Maududi *","link":"http://tanzil.net/trans/ur.maududi","id":"ur.maududi"},
               {"lang":"Urdu","name":"احمد رضا خان","translator":"Ahmed Raza Khan *","link":"http://tanzil.net/trans/ur.kanzuliman","id":"ur.kanzuliman"},
               {"lang":"Urdu","name":"احمد علی","translator":"Ahmed Ali *","link":"http://tanzil.net/trans/ur.ahmedali","id":"ur.ahmedali"},
               {"lang":"Urdu","name":"جالندہری","translator":"Fateh Muhammad Jalandhry","link":"http://tanzil.net/trans/ur.jalandhry","id":"ur.jalandhry"},
               {"lang":"Urdu","name":"طاہر القادری","translator":"Tahir ul Qadri *","link":"http://tanzil.net/trans/ur.qadri","id":"ur.qadri"},
               {"lang":"Urdu","name":"علامہ جوادی","translator":"Syed Zeeshan Haider Jawadi","link":"http://tanzil.net/trans/ur.jawadi","id":"ur.jawadi"},
               {"lang":"Urdu","name":"محمد جوناگڑھی","translator":"Muhammad Junagarhi *","link":"http://tanzil.net/trans/ur.junagarhi","id":"ur.junagarhi"},
               {"lang":"Urdu","name":"محمد حسین نجفی","translator":"Ayatollah Muhammad Hussain Najafi  *","link":"http://tanzil.net/trans/ur.najafi","id":"ur.najafi"},
               {"lang":"Uyghur","name":"محمد صالح","translator":"Muhammad Saleh","link":"http://tanzil.net/trans/ug.saleh","id":"ug.saleh"},
               {"lang":"Uzbek","name":"Мухаммад Содик","translator":"Muhammad Sodik Muhammad Yusuf","link":"http://tanzil.net/trans/uz.sodik","id":"uz.sodik"}],

      recite: [{"key":"abdulbasit","value":"AbdulBasit"},{"key":"abdulbasit-mjwd","value":"AbdulBasit (Mujawwad)"},{"key":"afasy","value":"Al-Afasy"},{"key":"ajamy","value":"Al-Ajamy"},{"key":"akhdar","value":"Al-Akhdar"},{"key":"ghamadi","value":"Al-Ghamadi"},{"key":"hudhaify","value":"Al-Hudhaify"},{"key":"husary","value":"Al-Husary"},{"key":"husary-mjwd","value":"Al-Husary (Mujawwad)"},{"key":"juhany","value":"Al-Juhany"},{"key":"matrood","value":"Al-Matrood"},{"key":"minshawi","value":"Al-Minshawi"},{"key":"minshawi-mjwd","value":"Al-Minshawi (Mujawwad)"},{"key":"muaiqly","value":"Al-Muaiqly"},{"key":"qasim","value":"Al-Qasim"},{"key":"hani","value":"Ar-Rafai"},{"key":"sudais","value":"As-Sudais"},{"key":"shateri","value":"Ash-Shateri"},{"key":"shuraim","value":"Ash-Shuraim"},{"key":"tablawi","value":"At-Tablawi"},{"key":"basfar","value":"Basfar"},{"key":"basfar2","value":"Basfar II"},{"key":"bukhatir","value":"Bukhatir"},{"key":"ayyub","value":"Muhammad Ayyub"},{"key":"jibreel","value":"Muhammad Jibreel"},{"key":"parhizgar","value":"Parhizgar"},{"key":"musayev","value":"Azerbaijani: Musayev"},{"key":"itani","value":"English: Itani"},{"key":"ibrahim","value":"English: Saheeh Intl."},{"key":"fooladvand","value":"Persian: فولادوند"},{"key":"makarem","value":"Persian: مکارم شیرازی"}],
      modes: [{key: "arabic", value: "Arabic Only"},{key: "arabicTrans", value: "Arabic and Translation"},{key: "trans", value: "Translation Only"}]
    };

    // Promise-based API
    return {
      loadOptions: function(name) {
        var options = Options[name] || [];
        return $q.when(options);
      },
      loadAllSuras: function() {
        var suras = [];
        // [start, ayas,  order,  rukus, name,  tname,  ename, type]
        // [    0,    1,      2,      3,    4,      5,      6,    7]
        for (var i in QuranData.Sura) {
          if (i != 0) {
            suras.push({
              sura: i,
              ayas: QuranData.Sura[i][1],
              name: QuranData.Sura[i][4],
              tname: QuranData.Sura[i][5],
              ename: QuranData.Sura[i][6],
              type: QuranData.Sura[i][7]
            });
          }
        }
        return $q.when(suras);
      },

      getSura: function(type, sura, aya, deferredAbort) {
         return $q(function(resolve, reject) {
            var
            filename = cordova.file.externalDataDirectory+'quran/'+type+'/'+sura+'/'+aya+'.json';
            $http({
               method: 'GET',
               url: filename,
               timeout: deferredAbort.promise
            }).then(function successCallback(response) {
               resolve(response.data);
            }, function errorCallback(response) {
               reject(response);
            });
         });
      },

      getTrans: function(trans, sura, aya, deferredAbort) {
         return $q(function(resolve, reject) {
            var
            filename = cordova.file.externalDataDirectory+'trans/'+trans+'/'+sura+'/'+aya+'.json';
            $http({
               method: 'GET',
               url: filename,
               timeout: deferredAbort.promise
            }).then(function successCallback(response) {
               resolve(response.data);
            }, function errorCallback(response) {
               reject(response);
            });

         });
      },

      getJuz: function() {

        var juz = [{}, {"no":"1","juz":"الم","name":"Alif Lam Meem"},{"no":"2","juz":"سَيَقُولُ","name":"Sayaqool"},{"no":"3","juz":"تِلْكَ الرُّسُلُ","name":"Tilkal Rusull"},{"no":"4","juz":"لَنْ تَنَالُوا","name":"Lan Tana Loo"},{"no":"5","juz":"وَالْمُحْصَنَاتُ","name":"Wal Mohsanat"},{"no":"6","juz":"لَا يُحِبُّ اللَّهُ","name":"La Yuhibbullah"},{"no":"7","juz":"وَإِذَا سَمِعُوا","name":"Wa Iza Samiu"},{"no":"8","juz":"وَلَوْ أَنَّنَا","name":"Wa Lau Annana"},{"no":"9","juz":"قَالَ الْمَلَأُ","name":"Qalal Malao"},{"no":"10","juz":"وَاعْلَمُوا","name":"Wa A'lamu"},{"no":"11","juz":"يَعْتَذِرُونَ","name":"Yatazeroon"},{"no":"12","juz":"وَمَا مِنْ دَابَّةٍ","name":"Wa Mamin Da'abat"},{"no":"13","juz":"وَمَا أُبَرِّئُ","name":"Wa Ma Ubrioo"},{"no":"14","juz":"رُبَمَا","name":"Rubama"},{"no":"15","juz":"سُبْحَانَ الَّذِي","name":"Subhanallazi"},{"no":"16","juz":"قَالَ أَلَمْ","name":"Qal Alam"},{"no":"17","juz":"اقْتَرَبَ","name":"Aqtarabo"},{"no":"18","juz":"قَدْ أَفْلَحَ","name":"Qadd Aflaha"},{"no":"19","juz":"وَقَالَ الَّذِينَ","name":"Wa Qalallazina"},{"no":"20","juz":"أَمَّنْ خَلَقَ","name":"A'man Khalaq"},{"no":"21","juz":"اتْلُ مَا أُوحِيَ","name":"Utlu Ma Oohi"},{"no":"22","juz":"وَمَنْ يَقْنُتْ","name":"Wa Manyaqnut"},{"no":"23","juz":"وَمَا لِيَ","name":"Wa Mali"},{"no":"24","juz":"فَمَنْ أَظْلَمُ","name":"Faman Azlam"},{"no":"25","juz":"إِلَيْهِ يُرَدُّ","name":"Elahe Yuruddo"},{"no":"26","juz":"حم","name":"Ha'a Meem"},{"no":"27","juz":"قَالَ فَمَا خَطْبُكُمْ","name":"Qala Fama Khatbukum"},{"no":"28","juz":"قَدْ سَمِعَ اللَّهُ","name":"Qadd Sami Allah"},{"no":"29","juz":"تَبَارَكَ الَّذِي","name":"Tabarakallazi"},{"no":"30","juz":"عَمَّ يَتَسَاءَلُونَ ","name":"Amma Yatasa'aloon"}];
        var
        jiza = [],
        ii = 1,
        Juz = QuranData.Juz,
        Sura = QuranData.Sura;

        Juz.forEach(function(val, index){

          if(Juz.length == index + 1) return;

          if(!index) return;
          var _juz = {
            no: index,
            juz: juz[index].juz,
            name: juz[index].name,
            suras: []
          };

          var
          from = val,
          to = Juz[index + 1],
          first = true;

          if(!to) return;

          for(var i = val[0]; i <= to[0]; i++) {

            var data = {};
            var
            _sura = Sura[i];
            if(!_sura) break;

            data.sura = {
              sura: i,
              ayas: _sura[1],
              name: _sura[4],
              tname: _sura[5],
              ename: _sura[6],
              type: _sura[7]
            };

          if(first) {

            if((to[0] - i) > 0 ) {
              data.from = from[1];
              data.to = _sura[1];
            } else { // if 0, means same sura
              data.from = from[1];
              data.to = to[1] - 1;
            }
            first = false;

          } else {
            if((to[0] - i) > 0 ) {
              data.from = 1;
              data.to = _sura[1];
            } else { // if 0, means same sura
              data.from = 1;
              if(to[1] == 1 && (to[0] - i) == 0) {
                data.to = 1;
              } else {
                data.to = to[1] - 1;
              }
            }
          }
          _juz.suras.push(data);
          }
          jiza.push(_juz);
        });
        return $q.when(jiza);
      }

    };
  }

})();