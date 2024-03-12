/* Custom pure event delegation functions.*/
EventTarget.prototype.delegateListener = function (b, c, d) {
  let a = (a) => {
    let b;
    [].slice
      .call(this.querySelectorAll(c))
      .reverse()
      .filter((b) => b.contains(a.target))
      .forEach((c) => {
        (void 0 === b || !1 !== b) && (b = d.call(c, a));
      });
  };
  return this.addEventListener(b, a), a;
};

class Custom {
  constructor(options = {}, containerSelector) {
    this.container = document.querySelector(containerSelector || `[data-template]`);
    this.mobileBreakpoint = options.mobileBreakpoint || `768px`;
    this.header = document.querySelector("header");
  }

  init() {
    this.setElementHeight();
    this.setScrollAttributes();

    console.log(this.mobileBreakpoint);
  }

  setElementHeight() {
    const handleElementHeight = () => {
      document.querySelectorAll("[data-height^='target']").forEach((el) => {
        const name = el.getAttribute("data-height").split("/")[1];
        if (name) {
          document.documentElement.style.setProperty(
            `--${name}`,
            `${el.clientHeight}px`
          );
        } else {
          const container = el.closest("[data-height='container']");
          container.style.setProperty(
            "--element_height",
            `${el.clientHeight}px`
          );

          setTimeout(() => {
            container.style.setProperty(
              "--element_height",
              `${el.clientHeight}px`
            );
          }, 500);
        }
      });
    };

    window.addEventListener("resize", handleElementHeight);
    window.addEventListener("load", handleElementHeight);
  }

  setScrollAttributes() {
    const handleScroll = () =>
      this.container.setAttribute("data-scrolled", window.scrollY > 0);

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("load", handleScroll);
  }

  setStickyElement(selector) {
    const elements = document.querySelectorAll(selector);

    const checkScrollPosition = (header) => {
      elements.forEach((element) => {
        const distance =
          element.getBoundingClientRect().top - header.clientHeight;
        const elementHeight = element.clientHeight;

        element.style.paddingTop = distance <= 0 ? `${elementHeight}px` : 0;
        element.setAttribute("data-sticky", distance <= 0);
      });
    };

    this.checkScrollPosition(elements, this.header.clientHeight);
    window.addEventListener("scroll", () => {
      checkScrollPosition(this.header);
    });
  }

  setInputValue(event, callback) {
    const self = event.target;
    const container = self.parentElement;
    const input = container.querySelector("input");
    const min = parseInt(input.getAttribute("min"), 10);
    const current = parseInt(input.value, 10);
    const max = parseInt(input.getAttribute("max"), 10);

    input.value = self.classList.contains("plus")
      ? current < max
        ? current + 1
        : max
      : current > min
      ? current - 1
      : min;

    if (self.classList.contains("minus") && current === min) {
      callback(input.value);
    }

    callback(input.value);

    input.dispatchEvent(new Event("input", { bubbles: true }));
  }

  handlelize(str) {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/([^\w]+|\s+)/g, "-")
      .replace(/\-\-+/g, "-")
      .replace(/(^-+|-+$)/g, "")
      .toLowerCase();
  }

  getUrlParameter(name) {
    const queryString = window.location.search.substring(1);
    const params = new URLSearchParams(queryString);
    return params.get(name);
  }

  debounce(func, delay) {
    let timerId;
  
    return (...args) => {
      clearTimeout(timerId);
      timerId = setTimeout(() => {
        func(...args);
      }, delay);
    };
  }

  fetchHTML(url, callback) {
    fetch(url, { cache: "no-cache"})
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.text();
      })
      .then((html) => {
        callback(html);
      })
      .catch((error) => {
        console.error("There was a problem:", error);
      });
  }
  
  getCookie(cookieName) {
    const name = cookieName + "=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const cookieArray = decodedCookie.split(";");

    for (let i = 0; i < cookieArray.length; i++) {
      let cookie = cookieArray[i].trim();
      if (cookie.indexOf(name) === 0) {
        return cookie.substring(name.length, cookie.length);
      }
    }
    return null;
  }

  setCookie(cookieName, cookieValue, daysToExpire) {
    let expirationDate = "";
    if (daysToExpire) {
      const expirationTime = new Date();
      expirationTime.setTime(
        expirationTime.getTime() + daysToExpire * 24 * 60 * 60 * 1000
      );
      expirationDate = "; expires=" + expirationTime.toUTCString();
    }
    document.cookie =
      cookieName +
      "=" +
      encodeURIComponent(cookieValue) +
      expirationDate +
      "; path=/";
  }
}

class CustomSection extends HTMLDivElement {
  constructor() {
    super();
    this.utils = new Custom();
  }

  connectedCallback() {
    this.parent = this.closest("section");
    this.type = this.parent.getAttribute("data-section");
    switch (this.type) {
      case "template":
        this.handleTemplateSection();
        break;

      default:
        console.warn(`Section "${this.type}" is not registered!`);
        break;
    }
  }
  
  handleTemplateSection() {
    console.log("template");
  }
}

const custom = new Custom({
  mobileBreakpoint: "768px"
});
custom.init();

customElements.define("custom-section", CustomSection, { extends: "div" });
