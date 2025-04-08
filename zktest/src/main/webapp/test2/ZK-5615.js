/**
 * Purpose: a patch for ZK-5615
 * Based on version: 9.6.4
 */
zk.afterLoad('zul.db', function() {
    // strictDate: No invalid date allowed (e.g., Jan 0 or Nov 31)
    // nonLenient: strictDate + inputs must match this object's format (no additional character allowed)
  zk.fmt.Date.parseDate =
  function (txt, fmt, nonLenient, refval, localizedSymbols, tz, strictDate) {
      if (!fmt) fmt = 'yyyy/MM/dd';
      refval = refval || zUtl.today(fmt, tz);

      localizedSymbols = localizedSymbols || {
        DOW_1ST: zk.DOW_1ST,
        MINDAYS: zk.MINDAYS,
        ERA: zk.ERA,
        YDELTA: zk.YDELTA,
        LAN_TAG: zk.LAN_TAG,
        SDOW: zk.SDOW,
        S2DOW: zk.S2DOW,
        FDOW: zk.FDOW,
        SMON: zk.SMON,
        S2MON: zk.S2MON,
        FMON: zk.FMON,
        APM: zk.APM
      };
      var y = refval.getFullYear(),
          m = refval.getMonth(),
          d = refval.getDate(), dFound,
          hr = refval.getHours(),
          min = refval.getMinutes(),
          sec = refval.getSeconds(),
          msec = refval.getMilliseconds(),
          aa = fmt.indexOf('a'),
          hasAM = aa > -1,
          hasG = fmt.indexOf('G') != -1,
          hasHour1 = hasAM && (fmt.indexOf('h') > -1 || fmt.indexOf('K') > -1),
          isAM,
          ts = _parseTextToArray(txt, fmt),
          regexp = /.*\D.*/,
          // ZK-2026: Don't use isNaN(), it will treat float as number.
          isNumber = !regexp.test(txt),
          eras = localizedSymbols.ERAS,
          era,
          eraKey;

      if (hasG && txt && eras) { // ZK-4745: parsing era for specific calendar system
        eraKey = this._findEraKey(txt, eras);
        if (eraKey)
          era = eras[eraKey];
      }

      var refDate = refval._moment.toDate(),
          localeDateTimeFormat = zk.ie < 11 ? null : new Intl.DateTimeFormat(localizedSymbols.LAN_TAG, {year: 'numeric'}),
          eraName = localizedSymbols.ERA || (eraKey ? eraKey : this.getEraName(refDate, localizedSymbols, localeDateTimeFormat)),
          ydelta = localizedSymbols.YDELTA || (era ? (0 - era.firstYear + era.direction * 1) : this.getYDelta(refDate, localeDateTimeFormat));

      if (!ts || !ts.length) return;
      for (var i = 0, j = 0, offs = 0, fl = fmt.length; j < fl; ++j) {
        var cc = fmt.charAt(j);
        if ((cc >= 'a' && cc <= 'z') || (cc >= 'A' && cc <= 'Z')) {
          var len = 1, k;
          for (k = j; ++k < fl; ++len)
            if (fmt.charAt(k) != cc)
              break;

          var nosep, nv; //no separator
          if (k < fl) {
            var c2 = fmt.charAt(k);
            nosep = 'yuMdEmsShHkKaAG'.indexOf(c2) != -1;
          }
          var token = isNumber ? ts[0].substring(j - offs, k - offs) : ts[i++];
          switch (cc) {
            case 'u':
            case 'y':
              // ZK-1985: Determine if token's length is less than the expected when nonLenient is true.
              if (nonLenient && token && (token.length < len))
                return;

              if (nosep) {
                if (len < 3) len = 2;
                if (token && token.length > len) {
                  ts[--i] = token.substring(len);
                  token = token.substring(0, len);
                }
              }

              // ZK-1985:	Determine if token contains non-digital word when nonLenient is true.
              if (nonLenient && token && regexp.test(token))
                return;

              if (!isNaN(nv = _parseInt(token))) {
                var newY = Math.min(nv, 200000); // Bug B50-3288904: js year limit
                if (newY < 100 && newY === (y + ydelta) % 100) break; // assume yy is not modified
                if (ydelta === 0 && newY < 100) { // only handle twoDigitYearStart with ISO calendar for now
                  // ZK-4235: Datefmt parseDate always return date between 1930-2029 when using yy format
                  var twoDigitYearStart = zk.TDYS,
                      lowerBoundary = (Math.floor(twoDigitYearStart / 100) * 100) + newY,
                      upperBoundary = lowerBoundary + 100;
                  y = lowerBoundary > twoDigitYearStart ? lowerBoundary : upperBoundary;
                } else {
                  if (cc == 'y') {
                    if (era)
                      newY = era.firstYear + era.direction * (newY - 1);
                    else
                      newY = (y + ydelta > 0) ? newY - ydelta : 1 - newY - ydelta;
                  }
                  y = newY;
                }
              }
              break;
            case 'M':
              var mon = token ? token.toLowerCase() : '',
                  isNumber0 = !isNaN(token) || len <= 2; // could be MM with nosep token
              if (!mon) break;
              if (!isNumber0 && token) {
                // MMM or MMMM
                var symbols;
                if (len == 3)
                  symbols = localizedSymbols.SMON;
                else if (len == 4)
                  symbols = localizedSymbols.FMON;
                else
                  break;

                for (var index = symbols.length, brkswch; --index >= 0;) {
                  var monStr = symbols[index].toLowerCase();

                  if ((nonLenient && mon == monStr) || (!nonLenient && mon.startsWith(monStr))) {
                    var monStrLen = monStr.length;

                    if (token && token.length > monStrLen)
                      ts[--i] = token.substring(monStrLen);

                    m = index;
                    brkswch = true;
                    break; // shall break to switch level: B50-3314513
                  }
                }
                if (brkswch)
                  break;
              }
              if (len == 3 && token) {
                if (nosep)
                  token = _parseToken(token, ts, --i, token.length);//token.length: the length of French month is 4
                if (isNaN(nv = _parseInt(token)))
                  return; // failed, B50-3314513
                m = nv - 1;
              } else if (len <= 2) {
                if (nosep && token && token.length > 2) {//Bug 2560497 : if no separator, token must be assigned.
                  ts[--i] = token.substring(2);
                  token = token.substring(0, 2);
                }
                if (isNaN(nv = _parseInt(token)))
                  return; // failed, B50-3314513
                m = nv - 1;
              } else {
                for (var l = 0; ; ++l) {
                  if (l == 12) return; //failed
                  if (len == 3) {
                    if (localizedSymbols.SMON[l] == token) {
                      m = l;
                      break;
                    }
                  } else {
                    if (token && localizedSymbols.FMON[l].startsWith(token)) {
                      m = l;
                      break;
                    }
                  }
                }
              }
              if (m > 11 /*|| m < 0 accept 0 since it is a common-yet-acceptable error*/) //restrict since user might input year for month
                return;//failed
              break;
            case 'E':
              if (nosep)
                _parseToken(token, ts, --i, len);
              break;
            case 'd':
              // ZK-1985:	Determine if token's length is less than expected when nonLenient is true.
              if (nonLenient && token && (token.length < len))
                return;

              if (nosep)
                token = _parseToken(token, ts, --i, len);

              // ZK-1985:	Determine if token contains non-digital word when nonLenient is true.
              if (nonLenient && token && regexp.test(token))
                return;

              if (!isNaN(nv = _parseInt(token))) {
                d = nv;
                dFound = true;
                if (d < 0 || d > 31) //restrict since user might input year for day (ok to allow 0 and 31 for easy entry)
                  return; //failed
              }
              break;
            case 'H':
            case 'h':
            case 'K':
            case 'k':
              // ZK-1985:	Determine if token's length is less than the expected when nonLenient is true.
              if (nonLenient && token && (token.length < len))
                return;

              if (hasHour1 ? (cc == 'H' || cc == 'k') : (cc == 'h' || cc == 'K'))
                break;
              if (nosep)
                token = _parseToken(token, ts, --i, len);

              // ZK-1985:	Determine if token contains non-digital word when nonLenient is true.
              if (nonLenient && token && regexp.test(token))
                return;

              if (!isNaN(nv = _parseInt(token)))
                hr = (cc == 'h' && nv == 12) || (cc == 'k' && nv == 24) ?
                    0 : cc == 'K' ? nv % 12 : nv;
              break;
            case 'm':
            case 's':
            case 'S':
              // ZK-1985:	Determine if token's length is less than the expected when nonLenient is true.
              if (nonLenient && token && (token.length < len))
                return;

              if (nosep)
                token = _parseToken(token, ts, --i, len);

              // ZK-1985:	Determine if token contains non-digital word when nonLenient is true.
              if (nonLenient && token && regexp.test(token))
                return;

              if (!isNaN(nv = _parseInt(token))) {
                if (cc == 'm') min = nv;
                else if (cc == 's') sec = nv;
                else msec = nv;
              }
              break;
            case 'a':
              if (!hasHour1)
                break;
              if (nosep)
                token = _parseToken(token, ts, --i, len);
              if (!token) return; //failed
              var tokenUpperCase = token.toUpperCase(),
                  apmText = localizedSymbols.APM[0].toUpperCase();
              if (tokenUpperCase.startsWith(apmText)) {
                isAM = true;
              } else if (apmText.startsWith(tokenUpperCase) && ts[i] && apmText.endsWith(ts[i].toUpperCase())) { // ZK-5216, Spanish AM/PM
                isAM = true;
                i++;
              } else {
                isAM = false;
              }
              break;
            case 'G':
              if (nosep && eras) {
                if (!eraName) return; // no era match
                token = _parseToken(token, ts, --i, eraName.length);
              }
              if (eraName && token != eraName && eraName.length > token.length) { // there is space in eraName
                token = eraName;
                i += eraName.match(/([\s]+)/g).length;
              }
              break;
              //default: ignored
          }
          j = k - 1;
        } else offs++;
      }

      if (hasHour1 && isAM === false)
        hr += 12;
      var dt;
      if (m == 1 && d == 29 && ydelta) {
        dt = new LeapDay(y, m, d, hr, min, sec, msec, tz);
        dt.setOffset(ydelta);
      } else {
        dt = Dates.newInstance([y, m, d, hr, min, sec, msec], tz);
      }
      if (!dFound && dt.getMonth() != m)
        dt = Dates.newInstance([y, m + 1, 0, hr, min, sec, msec], tz); //last date of m
      if (nonLenient || strictDate)
        if (dt.getFullYear() != y || dt.getMonth() != m || dt.getDate() != d
            || dt.getHours() != hr || dt.getMinutes() != min || dt.getSeconds() != sec) //ignore msec (safer though not accurate)
          return; //failed
      if (nonLenient) {
        txt = txt.trim();
        for (var j = 0; j < ts.length; j++)
          txt = txt.replace(ts[j], '');
        for (var k = txt.length; k--;) {
          var cc = txt.charAt(k);
          if ((cc > '9' || cc < '0') && fmt.indexOf(cc) < 0)
            return; //failed
        }
      }
      return +dt == +refval ? refval : dt;
      //we have to use getTime() since dt == refVal always false
    };

    function _parseTextToArray(txt, fmt) {
      //ZK-5423
      var literals = extractLiteral(fmt); //extract literal token from format
      //remove literal from format and text
      fmt = fmt.replace(/'.*?'/g, ' ');  //remove any string enclosed by single quotes
      txt = removeLiteral(txt, literals);
      if (fmt.indexOf('\'') > -1) //Bug ZK-1341: 'long+medium' format with single quote in zh_TW locale failed to parse AM/PM
        fmt = fmt.replace(/'/g, '');
      var ts = [], mindex = fmt.indexOf('MMM'), eindex = fmt.indexOf('E'),
          fmtlen = fmt.length, ary = [],
          //mmindex = mindex + 3,
          aa = fmt.indexOf('a'),
          gg = fmt.indexOf('G'),
          tlen = txt.replace(/[^.]/g, '').length,
          flen = fmt.replace(/[^.]/g, '').length;


      for (var i = 0, k = 0, j = txt.length; k < j; i++, k++) {
        var c = txt.charAt(k),
            f = fmtlen > i ? fmt.charAt(i) : '';
        if (c.match(/\d/)) {
          ary.push(c);
        } else if ((mindex >= 0 && mindex <= i /*&& mmindex >= i location French will lose last char */)
            || (eindex >= 0 && eindex <= i) || (aa > -1 && aa <= i) || (gg > -1 && gg <= i)) {
          if (c.match(/\w/)) {
            ary.push(c);
          } else {
            if (c.charCodeAt(0) < 128 && (c.charCodeAt(0) != 46
                || tlen == flen || f.charCodeAt(0) == 46)) {
              if (ary.length) {
                ts.push(ary.join(''));
                ary = [];
              }
            } else
              ary.push(c);
          }
        } else if (ary.length) {
          if (txt.charAt(k - 1).match(/\d/))
            while (f == fmt.charAt(i - 1) && f) {
              f = fmt.charAt(++i);
            }
          ts.push(ary.join(''));
          ary = [];
        } else if (c.match(/\w/))
          return; //failed
      }
      if (ary.length) ts.push(ary.join(''));
      return ts;
    }
    function _parseToken(token, ts, i, len) {
      if (len < 2) len = 2;
      if (token && token.length > len) {
        ts[i] = token.substring(len);
        return token.substring(0, len);
      }
      return token;
    }
    function _parseInt(v) {
    return parseInt(v, 10);
  }

    /* extracts any text enclosed by single quote and chinese character from a format */
    function extractLiteral(format){
        var pattern = /'(.*?)'/g;
        var matches = [];
        var match;

        while ((match = pattern.exec(format)) !== null
                && match[1].length > 0) {
            matches.push(match[1]);
        }
        let chineseCharacters = format.match(/[\p{Script=Han}]/gu)
        if (chineseCharacters && chineseCharacters.length > 0){
            matches = matches.concat(chineseCharacters);
        }
        return matches;
    }


    /* remove literals from str for those exactly matched characters.
    * e.g. only remove 'de', not 'de' in 'dezembro' */
    function removeLiteral(str, literals) {
      if (literals.length === 0) {
        return str;
      }
      /* concatenates the word boundary marker \\b to the beginning and end of the literal. The word boundary marker is a special pattern in regular expressions that matches positions where one side is a word character (like letters or digits) and the other side is not a word character (like a space or punctuation). This ensures that the pattern will only match whole words that exactly match the literal */
      literals = literals.map(function (literal) {
        //ZK-5615
        if (hasChineseCharacters(literal)){
          return literal;
        }
        return '\\b' + escapeRegExp(literal) + '\\b';
      });
      var pattern = new RegExp(literals.join('|'), 'g');
      return str.replace(pattern, ' ');
    }

    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    function hasChineseCharacters(str) {
        var chinesePattern = new RegExp("[\u4e00-\u9FFF]");
        return chinesePattern.test(str);
    }

});

