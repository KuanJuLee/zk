/**
 * Purpose: a patch for https://tracker.zkoss.org/browse/ZK-5452
 * Based on version: 9.6.3
 * Last modified: 2023-5-26
 */
zk.afterLoad('zul.wgt', function() {
    if (!zk.mobile){ //patch only for mobile browsers
        return;
    }
    var _xProgressmeter = {};
    zk.override(zul.wgt.Progressmeter.prototype, _xProgressmeter, {
        _fixImgWidth: fixImgWidth = function () {
          var n = this.$n(),
              img = this.$n('img');

          if (img) {
            if (zk(n).isRealVisible()){ //Bug 3134159
                var $img = jq(img);
                $img.animate({
                  width: Math.round(n.clientWidth * this._value / 100) + 'px'
                }, {
                  duration: $img.zk.getAnimationSpeed(600),
                  step: function step(now, fx) {
                    img.firstChild.style.left = now + 'px';
                  }
                });
            }
          }
        },
        onSize: fixImgWidth,
    });
});
