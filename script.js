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
     2) Sidebar nav visual state
        - Hover: hovered project scales up; every other nav item
          AND the entire right-hand content dims / blurs.
        - No hover: the project currently in view while scrolling
          (activeIndex, set in section 4) stays scaled up instead,
          so the sidebar always shows "where am I" on the page.
  ============================================================ */
  let hoveredItem = null;
  let activeIndex = -1;

  function refreshNavVisualState() {
    navItems.forEach((item, i) => {
      const link = item.querySelector('.nav-link');

      if (hoveredItem) {
        const isHovered = item === hoveredItem;
        gsap.to(link, { scale: isHovered ? 1.08 : 1, duration: 0.35, ease: 'power3.out' });
        gsap.to(item, {
          opacity: isHovered ? 1 : 0.28,
          filter: isHovered ? 'blur(0px)' : 'blur(1.5px)',
          duration: 0.4,
          ease: 'power2.out'
        });
      } else {
        const isActive = i === activeIndex;
        gsap.to(link, { scale: isActive ? 1.08 : 1, duration: 0.35, ease: 'power3.out' });
        gsap.to(item, { opacity: 1, filter: 'blur(0px)', duration: 0.4, ease: 'power2.out' });
      }
    });

    gsap.to(mainContent, {
      opacity: hoveredItem ? 0.45 : 1,
      filter: hoveredItem ? 'blur(2px)' : 'blur(0px)',
      duration: 0.4,
      ease: 'power2.out'
    });
  }

  navItems.forEach((item) => {
    item.addEventListener('mouseenter', () => {
      hoveredItem = item;
      refreshNavVisualState();
    });

    item.addEventListener('mouseleave', () => {
      hoveredItem = null;
      refreshNavVisualState();
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
    if (activeIndex === index) return;
    activeIndex = index;

    navItems.forEach((item, i) => item.classList.toggle('is-active', i === index));
    refreshNavVisualState();

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

  // matches the sidebar nav order exactly: CAREER, SKILL, STRENGTH, then the 4 projects
  const sectionIds = ['#career', '#skills', '#strength', '#project1', '#project2', '#project3', '#project4'];

  sectionIds.forEach((id, index) => {
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

  // hero has no matching nav item -> hide the indicator while it's in view
  const hero = document.querySelector('#hero');
  if (hero) {
    ScrollTrigger.create({
      trigger: hero,
      scroller: mainContent,
      start: 'top center',
      end: 'bottom center',
      onToggle: (self) => {
        if (self.isActive) setActiveNav(-1);
      }
    });
  }

  window.addEventListener('resize', () => ScrollTrigger.refresh());
});
