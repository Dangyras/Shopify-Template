class Utils {
  constructor() {
    if (Utils.instance) return Utils.instance;
    Utils.instance = this;

    this.settings = {
      hideClass: "hide",
      defaultBgColor: "#000",
    };

    document.addEventListener("DOMContentLoaded", () => {
      this.cacheDomElements();
      this.init();
    });
  }

  cacheDomElements() {
    this.settings.header = document.querySelector(".header");
    this.settings.headerWrapper = document.querySelector(".header-wrapper");
  }

  init() {
    this.extendEventTargetPrototype();
    this.initDataTriggerHandler();
    this.initSmoothScroll();
    this.initTooltips();
    this.initHeightEqualizer();
    this.initFeatureScripts();
    this.initResizeObserver();
    this.initImageSizeLogging();
  }

  initFeatureScripts() {
    this.initStickyButtonHandler();
    this.initProductCardVariantHandler();
    this.initProductCardButtonHandler();
  }

  initResizeObserver() {
    const onResizeFunction = (e) => {
      let doc = document.documentElement;

      if (document.querySelector(".announcement-bar-section")) {
        let announcementBar = document.querySelector(".announcement-bar-section");
        doc.style.setProperty('--announcement-height', announcementBar.clientHeight + "px");
      }

      if (document.querySelector(".section-header")) {
        let headerHeight = document.querySelector(".section-header").clientHeight;
        doc.style.setProperty('--headerMain-height', headerHeight + "px");
      }

      if (document.querySelector(".element-header")) {
        let headerHeight = document.querySelector(".element-header").clientHeight;
        doc.style.setProperty('--headerQuiz-height', headerHeight + "px");
      }

      if (document.querySelector(".footer")) {
        let footerHeight = document.querySelector(".footer").clientHeight;
        doc.style.setProperty('--footer-height', footerHeight + "px");
      }

      if (document.querySelector(".header-group")) {
        let headerGroupHeight = document.querySelector(".header-group").clientHeight;
        doc.style.setProperty("--headerGroup-height", `${headerGroupHeight}px`);
      }

      doc.style.setProperty("--app-height", `${window.innerHeight}px`);
    };

    document.addEventListener("DOMContentLoaded", onResizeFunction);
    window.addEventListener("resize", onResizeFunction);
  }

  initLazyBackgrounds() {
    const lazyBackgrounds = document.querySelectorAll(".style--backgroundLazy");

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const bg = entry.target;
          const style = bg.dataset.style;
          if (style) {
            bg.style.cssText += style;
            bg.classList.remove("style--backgroundLazy");
            observer.unobserve(bg);
          }
        }
      });
    });

    lazyBackgrounds.forEach((bg) => observer.observe(bg));
  }

  initProductCardVariantHandler() {
    const cache = {};
    document.delegateListener("click", "button[data-url]", async function () {
      const button = this;
      const url = button.dataset.url;
      const card = button.closest(".grid__item") || button.closest(".slide--inner");
      const contentWrapper = card;
      const allButtons = card.querySelectorAll("button[data-url]");

      allButtons.forEach((btn) => btn.classList.remove("style--selected"));
      button.classList.add("style--selected");

      if (cache[url]) {
        contentWrapper.innerHTML = cache[url];
        return;
      }

      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Network response was not ok");
        const html = await res.text();
        cache[url] = html;
        contentWrapper.innerHTML = html;
      } catch (err) {
        console.error("Variant fetch failed:", err);
      }
    });
  }

  initProductCardButtonHandler() {
    document.delegateListener("click", "button.element-button", async function () {
      const button = this;
      const variantId = button.dataset.id;
      if (!variantId) return;

      button.classList.add("style--buttonLoading");

      try {
        const res = await fetch("/cart/add.js", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ id: variantId, quantity: 1 }),
        });

        if (!res.ok) throw new Error("Failed to add to cart");

        const cartRes = await fetch("/cart.js");
        const cartData = await cartRes.json();

        publish(PUB_SUB_EVENTS.cartUpdate, {
          source: "custom-button",
          cartData,
          variantId,
        });
      } catch (err) {
        console.error("Add to cart failed:", err);
      } finally {
        button.classList.remove("style--buttonLoading");
      }
    });
  }

  initDataTriggerHandler() {
    document.body.addEventListener("click", (event) => {
      const button = event.target.closest("[data-trigger]");
      if (button) {
        const target = document.querySelector(button.getAttribute("data-trigger"));
        target?.click();
      }
    });
  }

  initSmoothScroll() {
    document.body.addEventListener("click", (event) => {
      const link = event.target.closest("[data-scroll]");
      if (link && link.getAttribute("href")) {
        event.preventDefault();
        const target = document.querySelector(link.getAttribute("href"));
        target?.scrollIntoView({ behavior: "smooth" });
      }
    });
  }

  initTooltips() {
    document.body.addEventListener("mouseover", (event) => {
      const tooltip = event.target.closest("[data-snippet='tooltip']");
      tooltip?.setAttribute("data-active", "true");
    });

    document.body.addEventListener("mouseout", (event) => {
      const tooltip = event.target.closest("[data-snippet='tooltip']");
      if (tooltip && !tooltip.contains(event.relatedTarget)) {
        tooltip.removeAttribute("data-active");
      }
    });
  }

  formatMoney(price) {
    const rate = Number(Shopify.currency.rate);
    // let formatString = window.utils.moneyFormat.indexOf("{amount_with_comma_separator}}") > -1 ? "{amount_with_comma_separator}}" : "{amount}}";

    return window.utils.moneyFormat.replace(/\{.*\}/g, ((price * rate) / 100).toFixed(2));
  }

  initHeightEqualizer() {
    this.applyHeightEqualization();
    setTimeout(() => this.applyHeightEqualization(), 1500);
    window.addEventListener("resize", () => this.applyHeightEqualization());
  }

  applyHeightEqualization() {
    document.querySelectorAll("section").forEach((section) => {
      const wrappers = section.querySelectorAll(".slider--wrapper");
      if (wrappers.length > 0) {
        wrappers.forEach((wrapper) => {
          this.equalizeHeight(wrapper);
          this.setHeightVariable(wrapper);
        });
      } else {
        this.equalizeHeight(section);
        this.setHeightVariable(section);
      }
    });
  }

  equalizeHeight(container) {
    const items = container.querySelectorAll('[data-height="equal"]');
    let maxHeight = 0;
    items.forEach((el) => {
      el.style.height = "auto";
      maxHeight = Math.max(maxHeight, el.offsetHeight);
    });
    if (maxHeight > 20) {
      container.style.setProperty("--element-heights", `${maxHeight}px`);
    }
  }

  setHeightVariable(section) {
    const el = section.querySelector('[data-height="set"]');
    if (el && el.offsetHeight > 20) {
      section.style.setProperty("--element-height", `${el.offsetHeight}px`);
    }
  }

  extendEventTargetPrototype() {
    if (!EventTarget.prototype.delegateListener) {
      EventTarget.prototype.delegateListener = function (eventType, selector, callback) {
        this.addEventListener(eventType, function (event) {
          const match = event.target.closest(selector);
          if (match && this.contains(match)) callback.call(match, event);
        });
      };
    }

    // OLD
    // if (!EventTarget.prototype.delegateListener) {
    //   EventTarget.prototype.delegateListener = function (eventType, selector, callback) {
    //     let handler = (event) => {
    //       let matched;
    //       [].slice
    //         .call(this.querySelectorAll(selector))
    //         .reverse()
    //         .filter((el) => el.contains(event.target))
    //         .forEach((el) => {
    //           if (matched === undefined || matched !== false) {
    //             matched = callback.call(el, event);
    //           }
    //         });
    //     };
    //     this.addEventListener(eventType, handler);
    //     return handler;
    //   };
    // }
  }

  initStickyButtonHandler() {
    const stickyButton = document.querySelector(".sticky--button .button--primary");
    stickyButton?.addEventListener("click", () => {
      const submitBtn = document.querySelector('[type="submit"].product-form__submit');
      submitBtn?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }
}

new Utils();


class DropdownElement extends HTMLElement {
  connectedCallback() {
    this.init();
  }

  init() {
    Element.prototype.on = function (event, callback, options = false) {
      if (!this._eventNamespaces) {
        this._eventNamespaces = {};
      }
      this._eventNamespaces[event] = callback;
      this.addEventListener(event.split(".")[0], callback, options);
      return this;
    };

    Element.prototype.off = function (event) {
      if (!this._eventNamespaces) return;
      const callback = this._eventNamespaces[event];
      if (callback) {
        this.removeEventListener(event.split(".")[0], callback);
        delete this._eventNamespaces[event];
      }
      return this;
    };

    this.cleanupText();
    this.initializeDropdown();
  }

  cleanupText() {
    const paragraphs = this.querySelectorAll(".dropdown--inner p");
    paragraphs.forEach((paragraph) => {
      paragraph.childNodes.forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          child.textContent = child.textContent.trim().replace(/\s+/g, " ");
        }
      });
    });

    if (this.querySelector(".dropdown--inner").textContent.trim() === "") {
      this.classList.add("hide");
    }
  }

  initializeDropdown() {
    const selectors = {
      trigger: '[data-dropwdown="trigger"]',
      body: '[data-dropwdown="body"]',
      inner: ".dropdown--inner",
    };

    const classes = {
      open: "is-open",
      transitioning: "is-transitioning",
    };

    let isTransitioning = false;

    const triggers = this.querySelectorAll(selectors.trigger);
    triggers.forEach((trigger) => {
      const state = trigger.classList.contains(classes.open);
      trigger.setAttribute("aria-expanded", state);

      trigger.off("click.dropdown");
      trigger.on("click.dropdown", (evt) => this.toggleDropdown(evt, selectors, classes, isTransitioning));
    });
  }

  toggleDropdown(evt, selectors, classes, isTransitioning) {
    if (isTransitioning) return;

    isTransitioning = true;

    const trigger = evt.currentTarget;
    const isOpen = trigger.classList.contains(classes.open);
    const bodyId = trigger.getAttribute("aria-controls");
    const body = this.querySelector(`#${bodyId}`);

    if (!body) {
      isTransitioning = false;
      return;
    }

    const contentHeight = body.querySelector(selectors.inner).offsetHeight;

    if (isOpen) {
      body.style.height = `${contentHeight}px`;
      requestAnimationFrame(() => {
        body.style.height = "0";
      });
    } else {
      body.style.height = "0";
      requestAnimationFrame(() => {
        body.style.height = `${contentHeight}px`;
      });
    }

    body.addEventListener(
      "transitionend",
      () => {
        body.style.height = isOpen ? "0" : "auto";
        body.classList.toggle(classes.open, !isOpen);
        isTransitioning = false;
      },
      { once: true }
    );

    trigger.setAttribute("aria-expanded", !isOpen);
    trigger.classList.toggle(classes.open, !isOpen);
  }
}

customElements.define("dropdown-element", DropdownElement);

class SliderElement extends HTMLElement {
  async connectedCallback() {
    const settings = this.getAttribute("data-settings");
    const parsedSettings = settings ? JSON.parse(settings) : {};
    const arrowNextButtons = [];
    const arrowPrevButtons = [];

    let swiperContainer = this.querySelector(".swiper");

    const parentSection = this.closest(".slider--wrapper") || this.closest("section");
    const paginationElement = parentSection ? parentSection.querySelector(".swiper-pagination") : null;
    const progressElement = parentSection ? parentSection.querySelector(".swiper-pagination.style--progressbar") : null;
    const scrollbarElement = parentSection ? parentSection.querySelector(".swiper-scrollbar") : null;

    const nextButton = parentSection?.querySelector(".swiper-button-next:not(.style--secondary)");
    const prevButton = parentSection?.querySelector(".swiper-button-prev:not(.style--secondary)");
    const nextButtonSecondary = parentSection?.querySelector(".swiper-button-next.style--secondary");
    const prevButtonSecondary = parentSection?.querySelector(".swiper-button-prev.style--secondary");

    if (nextButton && prevButton) {
      arrowNextButtons.push(nextButton);
      arrowPrevButtons.push(prevButton);
    }

    if (nextButtonSecondary && prevButtonSecondary) {
      arrowNextButtons.push(nextButtonSecondary);
      arrowPrevButtons.push(prevButtonSecondary);
    }

    const defaultSettings = {
      loop: true,
      spaceBetween: 10,
      autoplay: {
        delay: 8000,
      },
      navigation: {
        nextEl: arrowNextButtons,
        prevEl: arrowPrevButtons,
      },
    };

    if (progressElement) {
      defaultSettings.pagination = {
        el: progressElement,
        type: "progressbar",
      };
    } else if(paginationElement) {

      defaultSettings.pagination = {
        el: paginationElement,
        clickable: true,
      };
    }

    const updateCounter = (swiperInstance) => {
      const counterElement = parentSection?.querySelector(".swiper-counter");
      if (!counterElement) return;
      const total = swiperInstance.slides.length;
      const current = swiperInstance.realIndex + 1;
      
      counterElement.innerHTML = `${current.toString().padStart(2, "0")} / <span>${total.toString().padStart(2, "0")}</span>`; 
    };

    if(parentSection?.querySelector(".swiper-counter")) {
      defaultSettings.on = {
        slideChangeTransitionEnd(swiper) {
          updateCounter(swiper);
        },
      };
    }

    if (parsedSettings.thumbs) {
      parsedSettings.thumbs.swiper = parentSection.querySelector(".slider-thumbs .swiper");
      defaultSettings.pagination = {};
    }

    if (scrollbarElement) {
      defaultSettings.scrollbar = {
        el: scrollbarElement,
      };
    }
    
    if(this.classList.contains(".main-gallery")) {
      console.log(this);
    }

    const swiperSettings = {
      ...defaultSettings,
      ...parsedSettings
    };

    const dataContent = this.getAttribute("data-content");
    if(dataContent === "") {
      this.closest("section").classList.add("hide");
      return;
    }

    if (dataContent) {
      this.querySelector(".swiper-wrapper").classList.add("style--sectionLoading");


      const query = dataContent
        .split(",")
        .map((item) => `"${item}"`)
        .join("+OR+");
      const fetchUrl = `/search?q=${query}&view=slider`;

      try {
        const response = await fetch(fetchUrl);
        if (response.ok) {
          const html = await response.text();
          swiperContainer.querySelector(".swiper-wrapper").innerHTML = html;
          swiperContainer = this.querySelector(".swiper");

          if (swiperContainer) {
            new Swiper(swiperContainer, swiperSettings);
          } else {
            console.error("Swiper container not found after content update.");
          }
        } else {
          console.error("Failed to fetch slider content:", response.status);
        }
      } catch (error) {
        console.error("Error fetching slider content:", error);
      }
    } else {
      if (swiperContainer) {
        new Swiper(swiperContainer, swiperSettings);
      }
    }

    this.querySelector(".swiper-wrapper").classList.remove("style--sectionLoading");
  }
}

customElements.define("slider-element", SliderElement);

class UpsellElement extends HTMLElement {
  constructor() {
    super();
    this.upsellProductId = null;
    this.upsellProductIds = [];
  }

  connectedCallback() {
    this.updateSelectedUpsell();
    this.addEventListeners();
    this.checkAndFixCart();
  }

  addEventListeners() {
    this.querySelectorAll("input[type='radio']").forEach((radio) => {
      radio.addEventListener("change", () => this.handleSelectionChange());
    });

    document.addEventListener("upsell:update", (event) => {
      this.checkAndFixCart(event.detail);
    });
  }

  updateSelectedUpsell() {
    let checkedRadio = this.querySelector("input[type='radio']:checked");
    this.upsellProductId = checkedRadio ? checkedRadio.value : null;
    this.upsellProductIds = Array.from(this.querySelectorAll("input[type='radio']")).map((input) => input.value);
  }

  async fetchCart() {
    try {
      let response = await fetch("/cart.js");
      let cart = await response.json();
      return cart;
    } catch (error) {
      console.error("UpsellElement: Error fetching cart:", error);
      return null;
    }
  }

  async checkAndFixCart(cart = null) {
    let cartData = cart || (await this.fetchCart());
    if (!cartData) return;

    let upsellsInCart = cartData.items.filter((item) => this.upsellProductIds.includes(String(item.id))).map((item) => String(item.id));

    let hasProducts = cartData.items.some((item) => !this.upsellProductIds.includes(String(item.id))); // Check for non-upsell items
    let updates = {};

    if (upsellsInCart.length > 1) {
      upsellsInCart.forEach((id) => {
        if (id !== this.upsellProductId) updates[id] = 0;
      });
    }

    if (hasProducts && !upsellsInCart.includes(this.upsellProductId) && this.upsellProductId) {
      updates[this.upsellProductId] = 1;
    }

    if (!hasProducts && upsellsInCart.length > 0) {
      upsellsInCart.forEach((id) => (updates[id] = 0));
    }

    if (Object.keys(updates).length > 0) {
      this.modifyCart({ updates, sections: this.getSectionSelectors() });
    }
  }

  handleSelectionChange() {
    let previouslyChecked = this.upsellProductId;
    this.updateSelectedUpsell();

    let updates = {};

    if (previouslyChecked && previouslyChecked !== this.upsellProductId) {
      updates[previouslyChecked] = 0;
    }

    if (this.upsellProductId) {
      updates[this.upsellProductId] = 1;
    }

    if (Object.keys(updates).length > 0) {
      this.modifyCart({ updates, sections: this.getSectionSelectors() });
    }
  }

  modifyCart(updates) {
    document.querySelector(".cart-main")?.classList.add("style--sectionLoading");

    fetch("/cart/update.js", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    })
      .then((response) => response.json())
      .then((cart) => {
        publish("cartPage-update", {
          source: "cart-items",
          cartData: cart,
          variantId: this.upsellProductId,
        });
      })
      .catch((error) => console.error("UpsellElement: Error updating cart:", error));
  }

  getSectionSelectors() {
    return [document.getElementById("main-cart-footer")?.dataset.id, "cart-icon-bubble", "cart-live-region-text", document.getElementById("main-cart-items")?.dataset.id].filter(Boolean);
  }
}

customElements.define("upsell-element", UpsellElement);

class DynamicProducts extends HTMLElement {
  constructor() {
    super();
    this.debounceTimer = null;
    this.cache = new Map();
    this.type = "sku";
    this.debouncedLoadContent = debounce(this.loadContent.bind(this), 200);
  }

  connectedCallback() {
    this.ids = this.getAttribute("data-content");
    this.container = this.querySelector(".container");
    this.loadContent();
  }

  async loadContent() {
    if (!this.container || !this.ids) {
      console.error("Missing Data");
      return;
    }

    if (this.cache.has(this.ids)) {
      this.container.innerHTML = this.cache.get(this.ids);
      return;
    }

    const query = this.ids
      .split(",")
      .map((item) => encodeURIComponent(`"${item.trim()}"`))
      .join("+OR+");
    const fetchUrl = `/search?q=${query}&view=dynamic`;

    try {
      const response = await fetch(fetchUrl);
      if (response.ok) {
        const html = await response.text();
        this.cache.set(this.ids, html);
        this.container.innerHTML = html;
      } else {
        console.error("Failed to fetch slider content:", response.status);
      }
    } catch (error) {
      console.error("Error fetching slider content:", error);
    }
  }

  static get observedAttributes() {
    return ["data-content"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "data-content" && oldValue !== newValue) {
      this.ids = newValue;
      this.debouncedLoadContent();
    }
  }

  refresh() {
    this.debouncedLoadContent();
  }

  disconnectedCallback() {
    clearTimeout(this.debounceTimer);
  }
}

customElements.define("dynamic-products", DynamicProducts);

class PopupElement extends HTMLElement {
  constructor() {
    super();
    this.togglePopup = this.togglePopup.bind(this);
    this.closePopup = this.closePopup.bind(this);
    // this.handleOutsideClick = this.handleOutsideClick.bind(this);
    this.handleKeydown = this.handleKeydown.bind(this);
  }

  connectedCallback() {
    this.button = this.querySelector('button[type="button"]');
    this.popup = this.querySelector('.popup');
    this.inner = this.querySelector('.popup--inner');
    this.closeBtn = this.querySelector('[data-controls="close"]');

    if (this.button && this.popup) {
      this.button.addEventListener('click', this.togglePopup);
    }

    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', this.closePopup);
    }

    // document.addEventListener('click', this.handleOutsideClick);
    document.addEventListener('keydown', this.handleKeydown);
  }

  togglePopup() {
    const isVisible = this.popup.classList.contains('visible');
    if (isVisible) {
      this.closePopup();
    } else {
      this.popup.classList.add('visible');
      this.popup.setAttribute('aria-hidden', 'false');
      this.inner.focus();
    }
  }

  closePopup() {
    this.popup.classList.remove('visible');
    this.popup.setAttribute('aria-hidden', 'true');
    this.button.focus();
  }

  handleOutsideClick(e) {
    if (!this.contains(e.target)) {
      this.closePopup();
    }
  }

  handleKeydown(e) {
    if (!this.popup.classList.contains('visible')) return;

    if (e.key === 'Escape') {
      this.closePopup();
    }

    if (e.key === 'Tab') {
      const focusable = this.popup.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  disconnectedCallback() {
    document.removeEventListener('click', this.handleOutsideClick);
    document.removeEventListener('keydown', this.handleKeydown);
  }
}

customElements.define('popup-element', PopupElement);

class SelectElement extends HTMLElement {
  constructor() {
    super();
    this.select = null;
    this.input = null;
    this.dropdownContainer = null;
  }

  connectedCallback() {
    this.select = this.querySelector('select');
    this.input = this.querySelector('.search-input');
    this.dropdownContainer = this.querySelector('.select-drpdown--inner');

    this.renderDropdown();
    this.attachEventListeners();
    this.input.addEventListener('focus', () => {
      this.showDropdown(true);
      this.toggleActiveClass(true);
    });

    this.input.addEventListener('blur', () => {
      setTimeout(() => {
        this.showDropdown(false);
        this.toggleActiveClass(false);
      }, 200);
      
    });
  }

  attachEventListeners() {
    this.select.addEventListener('change', () => this.highlightSelected());

    this.input.addEventListener('input', () => this.filterOptions());

    const observer = new MutationObserver(() => this.renderDropdown());
    observer.observe(this.select, { childList: true, subtree: true });
  }

  toggleActiveClass(isActive) {
    const wrapper = this.querySelector('.select--inner');
    if (wrapper) {
      wrapper.classList.toggle('active', isActive);
    }
  }

  renderDropdown() {
    const options = Array.from(this.select.options);
    this.dropdownContainer.innerHTML = ''; // Clear current items

    options.forEach(option => {
      const item = document.createElement('div');
      item.className = 'dropdown-item';
      item.innerHTML = `<span data-value="${option.value}">${option.textContent}</span>`;

      item.addEventListener('click', () => {
        this.select.value = option.value;
        this.input.value = option.textContent;
        this.select.dispatchEvent(new Event('change'));
      });

      this.dropdownContainer.appendChild(item);
    });

    this.highlightSelected();
  }

  showDropdown(show) {
    const dropdown = this.querySelector('.select-drpdown--inner');
    if (dropdown) {
      dropdown.style.display = show ? 'block' : 'none';
    }
  }

  highlightSelected() {
    const selectedValue = this.select.value;
    const items = this.dropdownContainer.querySelectorAll('.dropdown-item span');

    items.forEach(item => {
      item.parentElement.classList.toggle('selected', item.dataset.value === selectedValue);
    });

    const selectedText = this.select.selectedOptions[0]?.textContent || '';
    this.input.value = selectedText;
  }

  filterOptions() {
    const query = this.input.value.toLowerCase();
    const items = this.dropdownContainer.querySelectorAll('.dropdown-item');

    items.forEach(item => {
      const text = item.textContent.toLowerCase();
      item.style.display = text.includes(query) ? '' : 'none';
    });
  }

  initImageSizeLogging() {
    const rootStyles = getComputedStyle(document.documentElement);
    const breakpoints = rootStyles.getPropertyValue('--breakpoints').replaceAll("px", "").split(', ').map(v => v.trim()).map(Number);
    const widthsCollected = new Map();
    let lastLoggedWidth = null;

    console.log("Breakpoints: ", breakpoints);

    const tryLogAll = () => {
      if (widthsCollected.size === breakpoints.length) {
        const widths = breakpoints.map(bp => widthsCollected.get(bp));
        const min = Math.min(...widths);
        const max = Math.max(...widths);
        const widthsStr = widths.map(w => w.toFixed(2)).join(', ');
        console.log(`${widthsStr}, ${min.toFixed(0)}:${max.toFixed(0)}`);
      }
    };

    window.addEventListener('resize', () => {
      const width = Math.floor(window.innerWidth);
      if (breakpoints.includes(width) && width !== lastLoggedWidth) {
        lastLoggedWidth = width;
        if (window.temp1 instanceof HTMLElement) {
          const renderedWidth = window.temp1.clientWidth;
          widthsCollected.set(width, renderedWidth);
          console.log(`\n[Viewport ${width}px] temp1 rendered size: ${renderedWidth.toFixed(2)}`);
          tryLogAll();
        } else {
          console.log(`\n[Viewport ${width}px] temp1 is not set or not an element.`);
        }
      }
    });

    const initWidth = Math.floor(window.innerWidth);
    if (breakpoints.includes(initWidth) && window.temp1 instanceof HTMLElement) {
      const renderedWidth = window.temp1.clientWidth;
      widthsCollected.set(initWidth, renderedWidth);
      console.log(`\n[Viewport ${initWidth}px] temp1 rendered size: ${renderedWidth.toFixed(2)}`);
      tryLogAll();
    }
  }
}

customElements.define('select-element', SelectElement);
