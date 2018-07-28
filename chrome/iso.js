// Generated by CoffeeScript 2.3.1
var Iso, callback, config, loadIso, observer, targetNode;

Iso = (function() {
  var COLORS, averageCount, bestDay, contributionsBox, dateOptions, dateWithYearOptions, firstDay, lastDay, maxCount, yearTotal;

  class Iso {
    constructor(target) {
      var graphContainer, observer;
      if (target) {
        graphContainer = ($('.js-contribution-graph')).parent()[0];
        if (graphContainer) {
          observer = new MutationObserver((mutations) => {
            var isGraphAdded;
            isGraphAdded = mutations.find(function(mutation) {
              return [].find.call(mutation.addedNodes, function(node) {
                return node.className === "js-contribution-graph";
              });
            });
            if (isGraphAdded) {
              return this.generateIsometricChart();
            }
          });
          observer.observe(graphContainer, {
            childList: true
          });
        }
        this.getSettings(() => {
          return this.generateIsometricChart();
        });
      }
    }

    getSettings(callback) {
      var ref, ref1;
      // Check for user preference, if chrome.storage is available.
      // The storage API is not supported in content scripts.
      // https://developer.mozilla.org/Add-ons/WebExtensions/Chrome_incompatibilities#storage
      if ((typeof chrome !== "undefined" && chrome !== null ? chrome.storage : void 0) != null) {
        return chrome.storage.local.get(['toggleSetting', 'show2DSetting'], ({toggleSetting, show2DSetting}) => {
          this.toggleSetting = toggleSetting != null ? toggleSetting : 'cubes';
          this.show2DSetting = show2DSetting != null ? show2DSetting : 'no';
          return callback();
        });
      } else {
        this.toggleSetting = (ref = localStorage.toggleSetting) != null ? ref : 'cubes';
        this.show2DSetting = (ref1 = localStorage.show2DSetting) != null ? ref1 : 'no';
        return callback();
      }
    }

    persistSetting(key, value, callback = function() {}) {
      var obj;
      if ((typeof chrome !== "undefined" && chrome !== null ? chrome.storage : void 0) != null) {
        obj = {};
        obj[key] = value;
        return chrome.storage.local.set(obj, callback);
      } else {
        localStorage[key] = value;
        return callback();
      }
    }

    generateIsometricChart() {
      this.resetValues();
      this.initUI();
      this.loadStats();
      return this.renderIsometricChart();
    }

    resetValues() {
      yearTotal = 0;
      averageCount = 0;
      maxCount = 0;
      bestDay = null;
      firstDay = null;
      lastDay = null;
      return contributionsBox = null;
    }

    initUI() {
      var htmlFooter, htmlToggle, insertLocation;
      ($('<div class="ic-contributions-wrapper"></div>')).insertBefore($('.js-calendar-graph'));
      ($('<canvas id="isometric-contributions" width="720" height="470"></canvas>')).appendTo('.ic-contributions-wrapper');
      contributionsBox = $('.js-contribution-graph');
      insertLocation = ($('.js-contribution-graph')).find('h2');
      // Inject toggle
      htmlToggle = "<span class=\"ic-toggle\">\n  <a href=\"#\" class=\"ic-toggle-option tooltipped tooltipped-nw squares\" data-ic-option=\"squares\" aria-label=\"Normal chart view\"></a>\n  <a href=\"#\" class=\"ic-toggle-option tooltipped tooltipped-nw cubes\" data-ic-option=\"cubes\" aria-label=\"Isometric chart view\"></a>\n</span>";
      ($(htmlToggle)).insertBefore(insertLocation);
      // Inject footer w/ toggle for showing 2D chart
      htmlFooter = "<span class=\"ic-footer\">\n  <a href=\"#\" class=\"ic-2d-toggle\">Show normal chart below ▾</a>\n</span>";
      ($(htmlFooter)).appendTo($('.ic-contributions-wrapper'));
      return this.observeToggle();
    }

    observeToggle() {
      var self;
      self = this;
      ($('.ic-toggle-option')).click(function(e) {
        var option;
        e.preventDefault();
        option = ($(this)).data('ic-option');
        if (option === 'squares') {
          (contributionsBox.removeClass('ic-cubes')).addClass('ic-squares');
        } else {
          (contributionsBox.removeClass('ic-squares')).addClass('ic-cubes');
        }
        ($('.ic-toggle-option')).removeClass('active');
        ($(this)).addClass('active');
        self.persistSetting("toggleSetting", option);
        return self.toggleSetting = option;
      });
      // Apply user preference
      ($(`.ic-toggle-option.${this.toggleSetting}`)).addClass('active');
      contributionsBox.addClass(`ic-${this.toggleSetting}`);
      ($('.ic-2d-toggle')).click(function(e) {
        e.preventDefault();
        if (contributionsBox.hasClass('show-2d')) {
          ($(this)).text('Show normal chart ▾');
          contributionsBox.removeClass('show-2d');
          self.persistSetting("show2DSetting", 'no');
          return self.show2DSetting = 'no';
        } else {
          ($(this)).text('Hide normal chart ▴');
          contributionsBox.addClass('show-2d');
          self.persistSetting("show2DSetting", 'yes');
          return self.show2DSetting = 'yes';
        }
      });
      // Apply user preference
      if (this.show2DSetting === "yes") {
        contributionsBox.addClass('show-2d');
        return ($('.ic-2d-toggle')).text('Hide normal chart ▴');
      } else {
        contributionsBox.removeClass('show-2d');
        return ($('.ic-2d-toggle')).text('Show normal chart ▾');
      }
    }

    loadStats() {
      var contribColumns, countTotal, currentDayCount, currentStreakEnd, currentStreakStart, d, dateBest, dateFirst, dateLast, datesCurrent, datesLongest, datesTotal, dayDifference, days, i, j, len, longestStreakEnd, longestStreakStart, streakCurrent, streakLongest, tempStreak, tempStreakStart;
      streakLongest = 0;
      streakCurrent = 0;
      tempStreak = 0;
      tempStreakStart = null;
      longestStreakStart = null;
      longestStreakEnd = null;
      currentStreakStart = null;
      currentStreakEnd = null;
      datesCurrent = null;
      contribColumns = $('.contrib-column');
      days = $('.js-calendar-graph rect.day');
      days.each(function(d) {
        var currentDayCount, tempStreakEnd;
        currentDayCount = ($(this)).data('count');
        yearTotal += currentDayCount;
        if (d === 0) {
          firstDay = ($(this)).data('date');
        }
        if (d === days.length - 1) {
          lastDay = ($(this)).data('date');
        }
        // Check for best day
        if (currentDayCount > maxCount) {
          bestDay = ($(this)).data('date');
          maxCount = currentDayCount;
        }
        // Check for longest streak
        if (currentDayCount > 0) {
          if (tempStreak === 0) {
            tempStreakStart = ($(this)).data('date');
          }
          tempStreak++;
          if (tempStreak >= streakLongest) {
            longestStreakStart = tempStreakStart;
            longestStreakEnd = ($(this)).data('date');
            return streakLongest = tempStreak;
          }
        } else {
          tempStreak = 0;
          tempStreakStart = null;
          return tempStreakEnd = null;
        }
      });
      // Check for current streak
      // Have to iterate and access differently than above because
      // we end up with a regular JS Array after reversing
      days = ($('.js-calendar-graph rect.day')).get().reverse();
      currentStreakEnd = days[0].getAttribute('data-date');
      for (i = j = 0, len = days.length; j < len; i = ++j) {
        d = days[i];
        currentDayCount = parseInt(d.getAttribute('data-count'), 10);
        // If there's no activity today, continue on to yesterday
        if (i === 0 && currentDayCount === 0) {
          currentStreakEnd = days[1].getAttribute('data-date');
          continue;
        }
        if (currentDayCount > 0) {
          streakCurrent++;
          currentStreakStart = d.getAttribute('data-date');
        } else {
          break;
        }
      }
      if (streakCurrent > 0) {
        currentStreakStart = this.formatDateString(currentStreakStart, dateOptions);
        currentStreakEnd = this.formatDateString(currentStreakEnd, dateOptions);
        datesCurrent = currentStreakStart + " — " + currentStreakEnd;
      } else {
        datesCurrent = "No current streak";
      }
      // Year total
      countTotal = yearTotal.toLocaleString();
      dateFirst = this.formatDateString(firstDay, dateWithYearOptions);
      dateLast = this.formatDateString(lastDay, dateWithYearOptions);
      datesTotal = dateFirst + " — " + dateLast;
      // Average Contribution per Day
      dayDifference = this.datesDayDifference(firstDay, lastDay);
      averageCount = this.precisionRound(yearTotal / dayDifference, 2);
      // Best day
      dateBest = this.formatDateString(bestDay, dateOptions);
      if (!dateBest) {
        dateBest = 'No activity found';
      }
      // Longest streak
      longestStreakStart = this.formatDateString(longestStreakStart, dateOptions);
      longestStreakEnd = this.formatDateString(longestStreakEnd, dateOptions);
      datesLongest = longestStreakStart + " — " + longestStreakEnd;
      this.renderTopStats(countTotal, averageCount, datesTotal, maxCount, dateBest);
      return this.renderBottomStats(streakLongest, datesLongest, streakCurrent, datesCurrent);
    }

    renderTopStats(countTotal, averageCount, datesTotal, maxCount, dateBest) {
      var html;
      html = `<div class="ic-stats-block ic-stats-top">\n  <span class="ic-stats-table">\n    <span class="ic-stats-row">\n      <span class="ic-stats-label">1 year total\n        <span class="ic-stats-count">${countTotal}</span>\n        <span class="ic-stats-average">${averageCount}</span> per day\n      </span>\n      <span class="ic-stats-meta ic-stats-total-meta">\n        <span class="ic-stats-unit">contributions</span>\n        <span class="ic-stats-date">${datesTotal}</span>\n      </span>\n    </span>\n    <span class="ic-stats-row">\n      <span class="ic-stats-label">Busiest day\n        <span class="ic-stats-count">${maxCount}</span>\n      </span>\n      <span class="ic-stats-meta">\n        <span class="ic-stats-unit">contributions</span>\n          <span class="ic-stats-date">${dateBest}</span>\n        </span>\n      </span>\n    </span>\n  </span>\n</div>`;
      return ($(html)).appendTo($('.ic-contributions-wrapper'));
    }

    renderBottomStats(streakLongest, datesLongest, streakCurrent, datesCurrent) {
      var html;
      html = `<div class="ic-stats-block ic-stats-bottom">\n  <span class="ic-stats-table">\n    <span class="ic-stats-row">\n      <span class="ic-stats-label">Longest streak\n        <span class="ic-stats-count">${streakLongest}</span>\n      </span>\n      <span class="ic-stats-meta">\n        <span class="ic-stats-unit">days</span>\n        <span class="ic-stats-date">${datesLongest}</span>\n      </span>\n    </span>\n    <span class="ic-stats-row">\n      <span class="ic-stats-label">Current streak\n        <span class="ic-stats-count">${streakCurrent}</span>\n      </span>\n      <span class="ic-stats-meta">\n        <span class="ic-stats-unit">days</span>\n        <span class="ic-stats-date">${datesCurrent}</span>\n      </span>\n    </span>\n  </span>\n</div>`;
      return ($(html)).appendTo($('.ic-contributions-wrapper'));
    }

    renderIsometricChart() {
      var GH_OFFSET, MAX_HEIGHT, SIZE, canvas, contribCount, pixelView, point, self;
      SIZE = 10;
      GH_OFFSET = 12;
      MAX_HEIGHT = 100;
      canvas = document.getElementById('isometric-contributions');
      // create pixel view container in point
      point = new obelisk.Point(110, 110);
      pixelView = new obelisk.PixelView(canvas, point);
      contribCount = null;
      self = this;
      return ($('.js-calendar-graph g > g')).each(function(g) {
        var x;
        x = parseInt(((($(this)).attr('transform')).match(/(\d+)/))[0] / (GH_OFFSET + 1));
        return (($(this)).find('rect')).each(function(r) {
          var color, cube, cubeHeight, dimension, fill, p3d, y;
          r = ($(this)).get(0);
          y = parseInt((($(this)).attr('y')) / GH_OFFSET);
          fill = ($(this)).attr('fill');
          contribCount = parseInt(($(this)).data('count'));
          cubeHeight = 3;
          if (maxCount > 0) {
            cubeHeight += parseInt(MAX_HEIGHT / maxCount * contribCount);
          }
          dimension = new obelisk.CubeDimension(SIZE, SIZE, cubeHeight);
          color = self.getSquareColor(fill);
          cube = new obelisk.Cube(dimension, color, false);
          p3d = new obelisk.Point3D(SIZE * x, SIZE * y, 0);
          return pixelView.renderObject(cube, p3d);
        });
      });
    }

    getSquareColor(fill) {
      var color;
      return color = (function() {
        switch (fill.toLowerCase()) {
          case 'rgb(235, 237, 240)':
          case '#ebedf0':
            return COLORS[0];
          case 'rgb(198, 228, 139)':
          case '#c6e48b':
            return COLORS[1];
          case 'rgb(123, 201, 111)':
          case '#7bc96f':
            return COLORS[2];
          case 'rgb(35, 154, 59)':
          case '#239a3b':
            return COLORS[3];
          case 'rgb(25, 97, 39)':
          case '#196127':
            return COLORS[4];
          default:
            if (fill.indexOf('#') !== -1) {
              return new obelisk.CubeColor().getByHorizontalColor(parseInt('0x' + fill.replace("#", "")));
            }
        }
      })();
    }

    formatDateString(dateStr, options) {
      var date, dateParts;
      date = null;
      if (dateStr) {
        dateParts = dateStr.split('-');
        date = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], 0, 0, 0).toLocaleDateString('en-US', options);
      }
      return date;
    }

    datesDayDifference(dateStr1, dateStr2) {
      var date1, date2, dateParts, diffDays, timeDiff;
      diffDays = null;
      date1 = null;
      date2 = null;
      if (dateStr1) {
        dateParts = dateStr1.split('-');
        date1 = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], 0, 0, 0);
      }
      if (dateStr2) {
        dateParts = dateStr2.split('-');
        date2 = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], 0, 0, 0);
      }
      if (dateStr1 && dateStr2) {
        timeDiff = Math.abs(date2.getTime() - date1.getTime());
        diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
      }
      return diffDays;
    }

    precisionRound(number, precision) {
      var factor;
      factor = Math.pow(10, precision);
      return Math.round(number * factor) / factor;
    }

  };

  COLORS = [new obelisk.CubeColor().getByHorizontalColor(0xebedf0), new obelisk.CubeColor().getByHorizontalColor(0xc6e48b), new obelisk.CubeColor().getByHorizontalColor(0x7bc96f), new obelisk.CubeColor().getByHorizontalColor(0x239a3b), new obelisk.CubeColor().getByHorizontalColor(0x196127)];

  yearTotal = 0;

  averageCount = 0;

  maxCount = 0;

  bestDay = null;

  firstDay = null;

  lastDay = null;

  contributionsBox = null;

  dateOptions = {
    month: "short",
    day: "numeric"
  };

  dateWithYearOptions = {
    month: "short",
    day: "numeric",
    year: "numeric"
  };

  return Iso;

}).call(this);

if (document.querySelector('.js-calendar-graph')) {
  loadIso = function() {
    if (!($('.js-contribution-graph')).hasClass('ic-cubes')) {
      return $(function() {
        var iso, target;
        target = document.querySelector('.js-calendar-graph');
        return iso = new Iso(target);
      });
    }
  };
  // load iso graph when the page first load
  loadIso();
  // load iso graph when pjax request load (switch between tabs)
  document.addEventListener('pjax:success', function() {
    console.log('pjax:success');
    return loadIso();
  });
  // load iso graph when contribution graph upload (change time)
  targetNode = document.getElementById('js-pjax-container');
  config = {
    attributes: false,
    childList: true,
    subtree: true
  };
  callback = function(mutationsList) {
    var j, len, mutation, node, results;
    results = [];
    for (j = 0, len = mutationsList.length; j < len; j++) {
      mutation = mutationsList[j];
      if (mutation.type === 'childList') {
        results.push((function() {
          var k, len1, ref, results1;
          ref = mutation.addedNodes;
          results1 = [];
          for (k = 0, len1 = ref.length; k < len1; k++) {
            node = ref[k];
            if (($(node)).hasClass('js-contribution-graph')) {
              results1.push(loadIso());
            } else {
              results1.push(void 0);
            }
          }
          return results1;
        })());
      } else {
        results.push(void 0);
      }
    }
    return results;
  };
  observer = new MutationObserver(callback);
  observer.observe(targetNode, config);
}
