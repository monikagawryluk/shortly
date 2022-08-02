'use strict';

const formShorten = document.querySelector('.shorten-input-box');
const inputShorten = document.querySelector('.input');
const linksContainer = document.querySelector('.shorten-links-box');
const errorMessage = document.querySelector('.error-message');
const btnMobileNavigation = document.querySelector('.btn-mobile-nav');
const mainNavigation = document.querySelector('.main-nav');
const imgHeroSection = document.querySelector('.hero-img');

const state = {
  links: [],
  linkCopied: '',
};

const removeClass = function (element, className) {
  element.classList.remove(className);
};

const addClass = function (element, className) {
  element.classList.add(className);
};

const handleLinkError = function (errorMessageRendered, errorMessageConsole) {
  addClass(inputShorten, 'input-error');
  errorMessage.textContent = `${errorMessageRendered}`;
  removeClass(errorMessage, 'hidden');
  throw new Error(errorMessageConsole);
};

const shortenLink = async function (link) {
  try {
    // Get data from API
    const res = await fetch(`https://api.shrtco.de/v2/shorten?url=${link}`);
    const data = await res.json();

    // Hide error message, if there is no error
    if (
      res.ok &&
      inputShorten.classList.contains('input-error') &&
      !errorMessage.classList.contains('hidden')
    ) {
      removeClass(inputShorten, 'input-error');
      addClass(errorMessage, 'hidden');
    }

    // Show error message
    if (!res.ok && data.error_code === 1) {
      handleLinkError('Please add a link', `${data.error} (${res.status})`);
    }

    if (!res.ok && data.error_code === 2) {
      handleLinkError(
        'Submitted link is not valid. Please try again.',
        `${data.error} (${res.status})`
      );
    }

    if (!res.ok && data.error_code !== 1 && data.error_code !== 2) {
      handleLinkError(
        `${data.error} (${res.status})`,
        `${data.error} (${res.status})`
      );
    }

    // Add link to state
    const linkObject = {
      linkLong: data.result.original_link,
      linkShort: data.result.full_short_link,
    };
    state.links.push(linkObject);
  } catch (err) {
    throw err;
  }
};

const renderShortenedLinks = function () {
  linksContainer.innerHTML = '';

  state.links.forEach((link, i) => {
    const markup = `
    <div class="link-box">
      <div class="link-long">
        <span>${link.linkLong}</span>
      </div>
      <div class="link-short-box">
        <div class="link-short">
          <span>${link.linkShort}</span>
        </div>
        <button class="btn btn-copy" data-btn-nr="${i}">Copy</button>
      </div>
    </div>        
  `;
    linksContainer.insertAdjacentHTML('afterbegin', markup);
  });
};

// Submit form in shorten section -> Render shortened link
formShorten.addEventListener('submit', async function (e) {
  try {
    e.preventDefault();

    // Get shortened link from API
    await shortenLink(`${inputShorten.value}`);

    // Save links in local storage
    localStorage.setItem('links', JSON.stringify(state.links));

    // Clear input field
    inputShorten.value = '';

    // Render links
    renderShortenedLinks();
  } catch (err) {
    console.error(err);
  }
});

const init = function () {
  // Get links from local storage
  const storage = localStorage.getItem('links');
  if (!storage) return;

  // Put links in state
  state.links = JSON.parse(storage);

  // Render links
  renderShortenedLinks();
};
init();

// Click button "Copy" -> Copy shortened link to clipboard
linksContainer.addEventListener('click', async function (e) {
  try {
    if (
      !e.target.classList.contains('btn-copy') ||
      e.target.classList.contains('btn-copy--copied')
    )
      return;

    // Change button "Copied" to "Copy"
    document.querySelectorAll('.btn-copy').forEach(btn => {
      if (!btn.classList.contains('btn-copy--copied')) return;

      removeClass(btn, 'btn-copy--copied');
      btn.textContent = 'Copy';
    });

    // Add currently copied link to state
    const btnCopy = e.target;
    const btnCopyNumber = +e.target.dataset.btnNr;

    state.links.forEach((link, i) => {
      if (btnCopyNumber === i) state.linkCopied = link.linkShort;
    });

    // Copy shortened link to clipboard
    await navigator.clipboard.writeText(state.linkCopied);

    // Change button "Copy" to "Copied"
    addClass(btnCopy, 'btn-copy--copied');
    btnCopy.textContent = 'Copied!';
    console.log('Async: Copying to clipboard was successful!');
  } catch (err) {
    console.error('Async: Could not copy text: ', err);
  }
});

// Click icon menu -> Show/hide mobile navigation
btnMobileNavigation.addEventListener('click', function () {
  mainNavigation.classList.toggle('nav-open');
  imgHeroSection.classList.toggle('hero-img--blurred');
});

const hideMobileNavigation = function () {
  removeClass(mainNavigation, 'nav-open');
  removeClass(imgHeroSection, 'hero-img--blurred');
};

// Click outside of mobile navigation -> Hide mobile navigation
document.addEventListener('mousedown', function (e) {
  if (
    e.target.closest('.main-nav') === null &&
    !e.target.classList.contains('icon-mobile-nav')
  ) {
    hideMobileNavigation();
  }
});

// Click Esc -> Hide mobile navigation
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' && mainNavigation.classList.contains('nav-open'))
    hideMobileNavigation();
});

// Smooth scrolling animation for links
document.body.addEventListener('click', function (e) {
  const link = e.target.closest('a');
  if (!link) return;

  // Scroll to the top of the page
  const href = link.getAttribute('href');

  if (href === '#') {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  // Hide mobile navigation after clicking link in the navigation
  if (
    link.classList.contains('main-nav-link') ||
    link.classList.contains('btn--sign-up')
  )
    hideMobileNavigation();
});

// Fixing flexbox gap property missing in some Safari versions
function checkFlexGap() {
  var flex = document.createElement('div');
  flex.style.display = 'flex';
  flex.style.flexDirection = 'column';
  flex.style.rowGap = '1px';

  flex.appendChild(document.createElement('div'));
  flex.appendChild(document.createElement('div'));

  document.body.appendChild(flex);
  var isSupported = flex.scrollHeight === 1;
  flex.parentNode.removeChild(flex);
  console.log(isSupported);

  if (!isSupported) document.body.classList.add('no-flexbox-gap');
}
checkFlexGap();
