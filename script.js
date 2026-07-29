gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

document.addEventListener('DOMContentLoaded', () => {

  const mainContent = document.getElementById('mainContent');
  const navItems = gsap.utils.toArray('.nav-item');
  const navIndicator = document.getElementById('navIndicator');

  /* ============================================================
     1) Smooth vertical scroll inside the right (scrollable) panel
        — triggered by clicking a sidebar project or a quick link
  ============================================================ */
  document.querySelectorAll('[data-target]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(el.getAttribute('data-target'));
      if (!target) return;

      gsap.to(mainContent, {
        duration: 1.1,
        ease: 'power2.inOut',
        scrollTo: { y: target, offsetY: 0 }
      });
    });
  });

  /* ============================================================
     2) Sidebar hover "spotlight" effect
        Hovered project scales up; every other nav item AND the
        entire right-hand content dims / blurs to keep focus.
  ============================================================ */
  navItems.forEach((item) => {
    const link = item.querySelector('.nav-link');
    const others = navItems.filter((n) => n !== item);

    item.addEventListener('mouseenter', () => {
      gsap.to(link, { scale: 1.08, duration: 0.35, ease: 'power3.out' });
      gsap.to(others, {
        opacity: 0.28,
        filter: 'blur(1.5px)',
        duration: 0.4,
        ease: 'power2.out'
      });
      gsap.to(mainContent, {
        opacity: 0.45,
        filter: 'blur(2px)',
        duration: 0.4,
        ease: 'power2.out'
      });
    });

    item.addEventListener('mouseleave', () => {
      gsap.to(link, { scale: 1, duration: 0.35, ease: 'power3.out' });
      gsap.to(navItems, {
        opacity: 1,
        filter: 'blur(0px)',
        duration: 0.4,
        ease: 'power2.out'
      });
      gsap.to(mainContent, {
        opacity: 1,
        filter: 'blur(0px)',
        duration: 0.4,
        ease: 'power2.out'
      });
    });
  });

  /* ============================================================
     3) Scroll-reveal — every ".reveal" element fades in and
        slides up as it enters the scrollable right panel
  ============================================================ */
  gsap.utils.toArray('.reveal').forEach((el) => {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        scroller: mainContent,
        start: 'top 88%',
        toggleActions: 'play none none reverse'
      }
    });
  });

  /* ============================================================
     4) Active-project indicator — a small bar in the sidebar
        tracks whichever project section is currently in view
  ============================================================ */
  function setActiveNav(index) {
    navItems.forEach((item, i) => item.classList.toggle('is-active', i === index));

    if (index === -1) {
      gsap.to(navIndicator, { opacity: 0, duration: 0.3 });
      return;
    }

    const activeLink = navItems[index].querySelector('.nav-link');
    gsap.to(navIndicator, {
      y: navItems[index].offsetTop,
      height: activeLink.offsetHeight,
      opacity: 1,
      duration: 0.45,
      ease: 'power3.out'
    });
  }

  const projectIds = ['#project1', '#project2', '#project3', '#project4'];

  projectIds.forEach((id, index) => {
    const section = document.querySelector(id);
    if (!section) return;

    ScrollTrigger.create({
      trigger: section,
      scroller: mainContent,
      start: 'top center',
      end: 'bottom center',
      onToggle: (self) => {
        if (self.isActive) setActiveNav(index);
      }
    });
  });

  // outside the project list (hero / about / skills) -> hide the indicator
  ['#hero', '#about', '#skills'].forEach((id) => {
    const section = document.querySelector(id);
    if (!section) return;

    ScrollTrigger.create({
      trigger: section,
      scroller: mainContent,
      start: 'top center',
      end: 'bottom center',
      onToggle: (self) => {
        if (self.isActive) setActiveNav(-1);
      }
    });
  });

  window.addEventListener('resize', () => ScrollTrigger.refresh());
});
