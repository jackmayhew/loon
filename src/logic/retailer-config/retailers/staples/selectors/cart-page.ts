export default {
  dom: {
    selectors: {
      items: '.cart__info .cart__item',
      name: (el: HTMLElement) => el.querySelector('.cart__item-title')?.textContent?.trim(),
      price: (el: HTMLElement) => el.querySelector('.text-right .medium')?.textContent?.trim(),
      url: (el: HTMLElement) => el.querySelector('.cart__item-title a')?.getAttribute('href'),
      image: (el: HTMLElement) => el.querySelector('.cart__item-image')?.getAttribute('src'),
      sku: (doc: Document) => {
        const skuElement = doc.querySelector('.cart__item-property.cart__item-sku')
        const sku = skuElement?.textContent?.split(':')[1]?.trim()
        return sku || undefined
      },
      uniqueId: (doc: Document) => {
        const skuElement = doc.querySelector('.cart__item-property.cart__item-sku')
        const sku = skuElement?.textContent?.split(':')[1]?.trim()
        return sku || undefined
      },
    },
  },
}
