// Hidden hue control: hold the photo and drag around its center.
(function() {
  const photo = document.querySelector('.profile-photo');
  if (!photo) return;
  const photoWrap = photo.closest('.profile-photo-wrap');
  const root = document.documentElement;
  let hue = Number(root.getAttribute('data-accent-hue') ?? 351);
  let drag = null;
  let frame = null;

  function angleAt(event) {
    const rect = photo.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    // Avoid unstable angles when the pointer is near the center.
    if (Math.hypot(x, y) < Math.min(rect.width, rect.height) * 0.1) return null;
    return Math.atan2(y, x);
  }

  function applyHue() {
    const value = hue.toFixed(2);
    root.style.setProperty('--theme-hue', value);
    root.setAttribute('data-accent-hue', value);
  }

  photo.addEventListener('pointerdown', function(event) {
    if (event.button !== 0 || event.isPrimary === false || drag) return;
    event.preventDefault();
    photo.setPointerCapture(event.pointerId);
    drag = { id: event.pointerId, angle: angleAt(event), changed: false };
    if (photoWrap) photoWrap.setAttribute('data-color-active', '');
  });

  photo.addEventListener('pointermove', function(event) {
    if (!drag || drag.id !== event.pointerId) return;
    const angle = angleAt(event);
    if (angle !== null && drag.angle !== null) {
      // Use the shortest angular delta to cross the -PI/PI seam smoothly.
      const delta = Math.atan2(Math.sin(angle - drag.angle), Math.cos(angle - drag.angle));
      if (Math.abs(delta) > 0.001) {
        hue = ((hue + delta * 180 / Math.PI) % 360 + 360) % 360;
        drag.changed = true;
        if (frame === null) {
          frame = requestAnimationFrame(function() {
            frame = null;
            applyHue();
          });
        }
      }
    }
    drag.angle = angle;
  });

  function finishDrag(event) {
    if (!drag || drag.id !== event.pointerId) return;
    if (drag.changed) {
      if (frame !== null) {
        cancelAnimationFrame(frame);
        frame = null;
      }
      applyHue();
    }
    drag = null;
    if (photoWrap) photoWrap.removeAttribute('data-color-active');
    if (photo.hasPointerCapture(event.pointerId)) photo.releasePointerCapture(event.pointerId);
  }

  photo.addEventListener('pointerup', finishDrag);
  photo.addEventListener('pointercancel', finishDrag);
  photo.addEventListener('lostpointercapture', finishDrag);
})();
