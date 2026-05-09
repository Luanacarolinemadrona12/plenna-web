(function () {
  "use strict";

  function isRootPage() {
    return !window.location.pathname.replace(/\\/g, "/").includes("/pages/");
  }

  function assetPath(file) {
    return (isRootPage() ? "" : "../") + file;
  }

  function symbolHref(name) {
    return assetPath("assets/icons/plenna-icons.svg?v=20260429-icons") + "#icon-" + name;
  }

  function svg(name, className, label) {
    var labelAttr = label ? ' role="img" aria-label="' + label.replace(/"/g, "&quot;") + '"' : ' aria-hidden="true" focusable="false"';
    return '<svg class="plenna-icon ' + (className || "") + '"' + labelAttr + '><use href="' + symbolHref(name) + '"></use></svg>';
  }

  function leafImage() {
    return assetPath("assets/images/plenna-leaf.png");
  }

  window.PlennaIcons = {
    assetPath: assetPath,
    leafImage: leafImage,
    svg: svg
  };
})();
