var Peepub          = require('../Peepub.js');
var _               = require('lodash');
var fs              = require('fs');
var cheerio         = require('cheerio');
var path            = require('path');
var epubJson        = require('../example.json');
var minimumEpubJson = require('../minimum.json');
var pp,min_pp;

describe("Assets in the EPUB", function(){
  beforeEach(function(){
    pp = new Peepub(_.cloneDeep(epubJson));
  });
  
  it("will make css files for you", function(){
    var epubPath = '';
    runs(function(){
      pp.create(function(err, file){
        epubPath = pp._epubPath();
      });
    });

    waitsFor(function(){
      return epubPath !== '';
    }, "it to assemble everything");

    runs(function(){
      expect(fs.existsSync(epubPath + Peepub.EPUB_CONTENT_DIR + 'styles')).toBe(true);
      pp.clean();
    });
  });
  
  it("puts the css in the manifest", function(){
    var epubPath = '';
    runs(function(){
      pp.create(function(err, file){
        epubPath = pp._epubPath();
      });
    });

    waitsFor(function(){
      return epubPath !== '';
    }, "it to assemble everything");

    runs(function(){
      var contentopf = fs.readFileSync(pp.contentOpfPath(), 'utf8');
      var $ = cheerio.load(contentopf);
      
      _.each(pp.assets.css, function(css){
        var itemCss = $('manifest item[id='+css.id+']');
        expect(itemCss.length).toBe(1);
        expect(fs.existsSync(epubPath + Peepub.EPUB_CONTENT_DIR + css.href)).toBe(true);
      });
      
      pp.clean();
    });
  });
  
  
  it("puts the js in the manifest", function(){
    var epubPath = '';
    runs(function(){
      pp.create(function(err, file){
        epubPath = pp._epubPath();
      });
    });

    waitsFor(function(){
      return epubPath !== '';
    }, "it to assemble everything");

    runs(function(){
      var contentopf = fs.readFileSync(pp.contentOpfPath(), 'utf8');
      var $ = cheerio.load(contentopf);
      
      _.each(pp.assets.js, function(js){
        var itemJs = $('manifest item[id='+js.id+']');
        expect(itemJs.length).toBe(1);
        expect(fs.existsSync(epubPath + Peepub.EPUB_CONTENT_DIR + js.href)).toBe(true);
      });
      
      pp.clean();
    });
  });
  
  it("makes image paths relative to the epub", function(){
    var epubPath = '';
    runs(function(){
      pp.create(function(err, file){
        epubPath = pp._epubPath();
      });
    });

    waitsFor(function(){
      return epubPath !== '';
    }, "it to assemble everything");

    runs(function(){
      
      for(var i in pp.json.pages){
        var page = pp.json.pages[i];
        var $page = cheerio.load(page.body);
        if($page('img').length > 0){
          expect($page('img').first().attr('src').match(/http/)).toBe(null);
          $htmlPage = cheerio.load(fs.readFileSync(page.path));
          expect($htmlPage("img[src='"+$page('img').first().attr('src')+"']").length > 0).toBe(true);
          
          break;
        }
      }
      pp.clean();
    });
  });
  
  it("image tags need to be closed", function(){
    var epubPath = '';
    runs(function(){
      pp.create(function(err, file){
        epubPath = pp._epubPath();
      });
    });

    waitsFor(function(){
      return epubPath !== '';
    }, "it to assemble everything");

    runs(function(){
      
      for(var i in pp.json.pages){
        var page = pp.json.pages[i];
        var $page = cheerio.load(page.body);
        if($page('img').length > 0){
          var regex = new RegExp('<img[^>]+></img>', 'i');
          expect(regex.test(page.body)).toBe(true);
          break;
        }
      }
      pp.clean();
    });
  });
  
  it("can pull in local assets", function(){
    var epubPath = '';
    var localTestFile = __dirname + "/assets/test.jpg";
    runs(function(){
      pp.json.pages[0].body += "<img src='file://"+localTestFile+"'/>";
      pp.create(function(err, file){
        epubPath = pp._epubPath();
      });
    });

    waitsFor(function(){
      return epubPath !== '';
    }, "it to assemble everything");

    runs(function(){
      expect(fs.existsSync(epubPath + Peepub.EPUB_CONTENT_DIR + 'assets/' + path.basename(localTestFile))).toBe(true);
      pp.clean();
    });
  });
  
  
  it("handles video tag assets", function(){
    var epubPath = '';
    runs(function(){
      pp.json.pages[0].body += "<video poster='http://placekitten.com/600/800' controls><source src='http://thepeoplesebook.net/pe-epub/testing/test.mp4' type='video/mp4'></video>";
      pp.create(function(err, file){
        epubPath = pp._epubPath();
      });
    });

    waitsFor(function(){
      return epubPath !== '';
    }, "it to assemble everything");

    runs(function(){
      expect(fs.existsSync(epubPath + Peepub.EPUB_CONTENT_DIR + 'assets/test.mp4')).toBe(true);
      expect(fs.existsSync(epubPath + Peepub.EPUB_CONTENT_DIR + 'assets/800')).toBe(true);
      pp.clean();
    });
  });
  
  it("makes video tag paths relative to the epub", function(){
    var epubPath = '';
    runs(function(){
      pp.json.pages[0].body += "<video poster='http://placekitten.com/600/800' controls><source src='http://thepeoplesebook.net/pe-epub/testing/test.mp4' type='video/mp4'></video>";
      pp.create(function(err, file){
        epubPath = pp._epubPath();
      });
    });

    waitsFor(function(){
      return epubPath !== '';
    }, "it to assemble everything");

    runs(function(){
      
      var page = pp.json.pages[0];
      var $page = cheerio.load(page.body);
      expect($page('video source').first().attr('src').match(/http/)).toBe(null);
      
      $htmlPage = cheerio.load(fs.readFileSync(page.path));
      expect($htmlPage("video source[src='"+$page('video source').first().attr('src')+"']").length > 0).toBe(true);
      pp.clean();
    });
  });
  
  it("image tags need to be closed when there's a video", function(){
    var epubPath = '';
    runs(function(){
      pp.json.pages[0].body += "<video poster='http://placekitten.com/600/800' controls><source src='http://thepeoplesebook.net/pe-epub/testing/test.mp4' type='video/mp4'></video>";
      pp.create(function(err, file){
        epubPath = pp._epubPath();
      });
    });

    waitsFor(function(){
      return epubPath !== '';
    }, "it to assemble everything");

    runs(function(){
      
      for(var i in pp.json.pages){
        var page = pp.json.pages[i];
        var $page = cheerio.load(page.body);
        if($page('img').length > 0){
          var regex = new RegExp('<img[^>]+></img>', 'g');
          expect(regex.test(page.body)).toBe(true);
          break;
        }
      }
      pp.clean();
    });
  });
  
});