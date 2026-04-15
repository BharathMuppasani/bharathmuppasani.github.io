(() => {
  "use strict";

  const { clearChildren } = window.SlideUtils;

  function createCodeStepper(config) {
    clearChildren(config.mount);
    config.mount.classList.add("code-block-shell");

    const fragment = document.createDocumentFragment();
    const lines = [];
    config.lines.forEach((line, index) => {
      const row = document.createElement("div");
      row.className = "code-line";
      const no = document.createElement("div");
      no.className = "line-no";
      no.textContent = `${index + 1}`;
      const body = document.createElement("div");
      body.className = "line-body";
      body.textContent = line;
      row.appendChild(no);
      row.appendChild(body);
      fragment.appendChild(row);
      lines.push(row);
    });
    config.mount.appendChild(fragment);

    function reset() {
      lines.forEach((line) => line.classList.remove("active"));
    }

    function highlight(indices) {
      reset();
      indices.forEach((index) => {
        if (lines[index]) {
          lines[index].classList.add("active");
        }
      });
    }

    return { reset, highlight };
  }

  window.createCodeStepper = createCodeStepper;
})();
