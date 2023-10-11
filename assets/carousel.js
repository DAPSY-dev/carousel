'use strict'

class Carousel {
  constructor(element, options = {}) {
    this.element = element
    this.options = {
      isInitClassName: 'js-init-carousel',
      slideInViewClassName: 'in-view',
      dotClassName: '',
      activeDotClassName: 'is-active',
      ...options,
    }
    this.swipeProps = {
      mouseDown: false,
      startX: 0,
      endX: 0,
      dist: 0,
    }
    this.wrapperEl = this.element.querySelector('.js-carousel-wrapper')
    this.wrapperElTranslate = 0
    this.slideEls = [...this.element.querySelectorAll('.js-carousel-slide')]
    this.prevBtn = this.element.querySelector('.js-carousel-prev')
    this.nextBtn = this.element.querySelector('.js-carousel-next')
    this.dots = this.element.querySelector('.js-carousel-dots')
    this.resizeTimeout = null
    this.goPrev = this.goPrev.bind(this)
    this.goNext = this.goNext.bind(this)
    this.handlePointerDown = this.handlePointerDown.bind(this)
    this.handlePointerMove = this.handlePointerMove.bind(this)
    this.handlePointerUp = this.handlePointerUp.bind(this)
    this.handlePointerLeave = this.handlePointerLeave.bind(this)
    this.handleResize = this.handleResize.bind(this)
    this.init()
  }

  isInit() {
    return this.element.classList.contains(this.options.isInitClassName)
  }

  init() {
    if (this.isInit()) {
      console.error(`Carousel is already initialized (id): ${this.element.dataset.id}`)
      return
    }
    this.setInViewSlides()
    if (this.dots) {
      this.createDots()
    }
    this.addEvents()
    this.element.classList.add(this.options.isInitClassName)
  }

  getScreen() {
    return Number(getComputedStyle(this.element).getPropertyValue('--carousel-screen'))
  }

  getSlidesCount() {
    return Number(getComputedStyle(this.element).getPropertyValue('--slides-count'))
  }

  getSlidesScreens() {
    return this.slideEls.length / this.getSlidesCount()
  }

  getMaxSlidesScreens() {
    return Math.ceil(this.getSlidesScreens())
  }

  setScreen(screen) {
    this.element.style.setProperty('--carousel-screen', screen)
  }

  setInViewSlides() {
    for (const slide of this.slideEls) {
      slide.classList.remove(this.options.slideInViewClassName)
    }
    const startSlide = this.getScreen() * this.getSlidesCount()
    for (let i = 0; i < this.getSlidesCount(); i++) {
      const slideEl = this.slideEls[startSlide + i]
      if (slideEl) {
        this.slideEls[startSlide + i].classList.add(this.options.slideInViewClassName)
      }
    }
  }

  goTo(screen) {
    this.setScreen(screen)
    if (this.dots) {
      this.setActiveDot()
    }
    this.setInViewSlides()
  }

  goPrev() {
    const screen = this.getScreen()
    if (screen === 0) {
      return
    }
    this.goTo(screen - 1)
  }

  goNext() {
    const screen = this.getScreen()
    if (screen + 1 >= this.getSlidesScreens()) {
      return
    }
    this.goTo(screen + 1)
  }

  createDots() {
    this.dots.innerHTML = ''
    const maxSlides = this.getMaxSlidesScreens()
    for (let i = 0; i < maxSlides; i++) {
      const dot = document.createElement('button')
      dot.type = 'button'
      dot.innerHTML = i + 1
      if (this.options.dotClassName) {
        dot.classList = this.options.dotClassName
      }
      dot.onclick = () => {
        this.goTo(i)
      }
      this.dots.appendChild(dot)
    }
    this.setActiveDot()
  }

  setActiveDot() {
    const screen = this.getScreen()
    const dotsChildren = [...this.dots.children]
    for (const dot of dotsChildren) {
      dot.classList.remove(this.options.activeDotClassName)
    }
    dotsChildren[screen].classList.add(this.options.activeDotClassName)
  }

  handleGesture() {
    if (this.swipeProps.endX < this.swipeProps.startX) {
      this.goNext()
    }
    if (this.swipeProps.endX > this.swipeProps.startX) {
      this.goPrev()
    }
  }

  setWrapperTranslate() {
    const style = window.getComputedStyle(this.wrapperEl)
    const matrix = new WebKitCSSMatrix(style.transform)
    this.wrapperElTranslate = matrix.m41
  }

  moveWrapperOnSwipe(dist) {
    this.wrapperEl.style.transform = `translateX(${this.wrapperElTranslate - dist}px)`
    this.wrapperEl.style.transition = 'all 0s ease 0s'
  }

  resetWrapperSwipeStyles() {
    this.wrapperEl.style.transform = ''
    this.wrapperEl.style.transition = ''
  }

  handlePointerDown(event) {
    if ('touches' in event) {
      this.swipeProps.startX = event.changedTouches[0].pageX
      this.swipeProps.dist = event.changedTouches[0].pageX
    } else {
      this.swipeProps.mouseDown = true
      this.swipeProps.startX = event.pageX
      this.swipeProps.dist = event.pageX
    }
    this.setWrapperTranslate()
  }

  handlePointerMove(event) {
    let dist = null
    if ('touches' in event) {
      dist = this.swipeProps.dist - event.changedTouches[0].pageX
    } else {
      if (!this.swipeProps.mouseDown) {
        return
      }
      event.preventDefault()
      dist = this.swipeProps.dist - event.pageX
    }
    this.moveWrapperOnSwipe(dist)
  }

  handlePointerUp(event) {
    if ('touches' in event) {
      this.swipeProps.endX = event.changedTouches[0].pageX
    } else {
      this.swipeProps.mouseDown = false
      this.swipeProps.endX = event.pageX
    }
    this.resetWrapperSwipeStyles()
    this.handleGesture()
  }

  handlePointerLeave(event) {
    if (!this.swipeProps.mouseDown) {
      return
    }
    this.handlePointerUp(event)
  }

  handleResize() {
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout)
    }
    this.resizeTimeout = setTimeout(() => {
      const screen = this.getScreen()
      const maxSlides = this.getMaxSlidesScreens()
      if (screen > maxSlides) {
        this.setScreen(maxSlides - 1)
      }
      if (this.dots) {
        this.createDots()
      }
      this.setInViewSlides()
    }, 50)
  }

  addEvents() {
    this.prevBtn.addEventListener('click', this.goPrev)
    this.nextBtn.addEventListener('click', this.goNext)
    this.element.addEventListener('touchstart', this.handlePointerDown)
    this.element.addEventListener('touchmove', this.handlePointerMove)
    this.element.addEventListener('touchend', this.handlePointerUp)
    this.element.addEventListener('mousedown', this.handlePointerDown)
    this.element.addEventListener('mousemove', this.handlePointerMove)
    this.element.addEventListener('mouseup', this.handlePointerUp)
    this.element.addEventListener('mouseleave', this.handlePointerLeave)
    window.addEventListener('resize', this.handleResize)
  }

  removeEvents() {
    this.prevBtn.removeEventListener('click', this.goPrev)
    this.nextBtn.removeEventListener('click', this.goNext)
    this.element.removeEventListener('touchstart', this.handlePointerDown)
    this.element.removeEventListener('touchmove', this.handlePointerMove)
    this.element.removeEventListener('touchend', this.handlePointerUp)
    this.element.removeEventListener('mousedown', this.handlePointerDown)
    this.element.removeEventListener('mousemove', this.handlePointerMove)
    this.element.removeEventListener('mouseup', this.handlePointerUp)
    this.element.removeEventListener('mouseleave', this.handlePointerLeave)
    window.removeEventListener('resize', this.handleResize)
  }

  destroy() {
    if (!this.isInit()) {
      console.error(`Carousel is not initialized (id): ${this.element.dataset.id}`)
      return
    }
    this.removeEvents()
    for (const slide of this.slideEls) {
      slide.classList.remove(this.options.slideInViewClassName)
    }
    if (this.dots) {
      this.dots.innerHTML = ''
    }
    this.element.classList.remove(this.options.isInitClassName)
  }
}
