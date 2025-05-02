var globals = {
    cartAB : 0,
    scartSlideIdx : 0
};
jQuery(document).ready(function ($){
    /*$(".single-product form.cart").bind("submit", function (e){
        let currentButton = $(this).find(".single_add_to_cart_button");
        currentButton.attr("disabled", "disabled");
        setTimeout(function (){
            currentButton.removeAttr("disabled");
        }, 5000)
        return true;
    });*/

    $(".onsale").remove();

    /** KIE fixes */
    var kieFixes = new KiierFixes();
    
    /** Navigation Customization */
    var megaMenu = new KiierrMenu();

    /** END Educational Banner */
    var eduBanner = new KiierrEduBanner();
 /** END Educational Banner */
    var eduBanner = new KiierrEduBanners();
    /** PDP Changes */
    var pdpChanges = new KIEPDPChanges();

    /** Cart Module Optimization  */
    var cartModule = new KIECartModule();

    /** Onetime purchase Options (autoship) */
    var otOptions = new KIEOTOptions();

    /** New PDP laser cap */
    var pdpLaserCap = new NewPDPLaserCap();

    var kieSPB = new KIESingleProductBehavior();

    var kiePromoBanner = new KIEPromoBanner();

    var offerPDP = new ExclusiveOfferPDP();

    var ScrollTo = (function () {
        var scrolltoLinks = jQuery('.data-scrollto');

        if( scrolltoLinks.length == 0 ) { return; }

        function goTo(target) {
            if (target === "" || !jQuery(target).length) { return; }
            var scrollPos = typeof target === 'number' ? target : jQuery(target).offset().top;

            jQuery('html, body').stop().animate({
                'scrollTop': scrollPos - 32
            }, 500);
        }

        jQuery(document).on('click',  '.data-scrollto',function(e) {
            e.preventDefault();
            var source = jQuery(this);
            if( source.hasClass('menu-item') ) {
                source = jQuery(this).find('>a');
            }

            var target = source.attr('href'),
                idx = 0;
            if( target ) {
                idx = target.indexOf('#');
                if( idx >= 0 ) {
                    target = target.substring(idx+1, target.length);
                    target = '.' + target;

                    if( jQuery(target).length > 0 ) {
                        goTo(target);
                    }
                }
            }
        });

    }());

    var readMoreToggle = new ReadMoreToggle();

    var updateLandingPageBtn = (function () {
        if (jQuery('body').hasClass('landing-page')) {
            var btnContainer = jQuery('.header-inner .mobile-nav .header-button-1');
            var btn = jQuery('.header-inner .mobile-nav .header-button-1 .header-button a');
            if ( btn.length > 0 ) { 
                btn.addClass('data-scrollto');
                btn.attr('href', 'https://kiierr.com/landing-page/#sec-offer-pdp');
                btn.find('>span').text('Restore Your Hair Today!');
                btnContainer.addClass('visible');
            }
        }
    }());
    
});

class KiierFixes {

    constructor(  ){
        this.eventHandlers();
    }

    eventHandlers() { 
        jQuery(window).scroll(this.onWindowScroll);
    }

    onWindowScroll() {
        /** sticky fix */
        var isPositionFixed = jQuery('body').hasClass('plp-affix');
        var viewportWidth = jQuery(window).width(),
            topMark = 200;
        
        if( viewportWidth <= 980  ) {
            topMark = 90;
        }

        if (jQuery(window).scrollTop() > topMark && !isPositionFixed){ 
            jQuery('body').addClass('plp-affix');
        }
        if (jQuery(window).scrollTop() < topMark && isPositionFixed){
            jQuery('body').removeClass('plp-affix');
        }
    }
}

class KiierrCart {

    constructor( $modal ){

        this.eventHandlers();

    }

    eventHandlers(){

        jQuery(document).on('click', '.et-cart-info', this.openCloseAdToCart.bind(this) );
        jQuery(document).on('click', '.kisc-modal__close', this.openCloseAdToCart.bind(this) );
        jQuery(document).on( 'click', '.kisc-modal__overlay', this.openCloseAdToCart.bind(this) );
        
        jQuery(document.body).on( 'added_to_cart', this.addedToCart.bind(this) );
        jQuery(document.body).on( 'submit', 'form.cart', this.addToCartFormSubmit.bind(this) );

        jQuery(document.body).on( 'click', '.kisc-modal .qty__minus', this.decreaseQty.bind(this) );
        jQuery(document.body).on( 'click', '.kisc-modal .qty__plus', this.increaseQty.bind(this) );
        jQuery(document.body).on( 'change', '.kisc-modal .qty__number', this.updateQtyChanged.bind(this) );
        
        jQuery(document.body).on( 'click', '.kisc-modal .product__trash', this.removeCartItem.bind(this) );
        jQuery(document.body).on( 'click', '.kisc-modal .add-to-cart-opt', this.addToCartButton.bind(this) );

        setTimeout( this.refreshCart.bind(this), 300 );
    }

    openCloseAdToCart(e) {
        if( globals.cartAB == 1 ) {
            e.preventDefault();
            jQuery('.kisc-wrap').toggleClass('active');
            jQuery('body').toggleClass('kisc-cart-active');
        }
    }

    refreshCart() {
        var thisObj = this;
        var data = {
            action: 'ki_refresh_sidecart',
        };
        jQuery.ajax({
            type: 'post',
            url: wc_add_to_cart_params.ajax_url,
            data: data,
            
            beforeSend: function (response) {
                jQuery('.kisc-modal').addClass('modal--loading');
            },
            complete: function (response) {
                jQuery('.kisc-modal').removeClass('modal--loading');
            }, 
            success: function (response) { 
                if (response.error) {
                    return;
                } else {
                    thisObj.updateFragments( { fragments: response.fragments } );
                }
            }, 
        });
    }

    addToCartFormSubmit(e){
        if( globals.cartAB == 1 ) {
            e.preventDefault();
            e.stopPropagation();
            var $thisbutton = jQuery('.single_add_to_cart_button'),
                $form = $thisbutton.closest('form.cart'),
                id = $thisbutton.val(),
                product_qty = $form.find('input[name=quantity]').val() || 1,
                product_id = $form.find('input[name=product_id]').val() || id,
                variation_id = $form.find('input[name=variation_id]').val() || 0;

            var data = {
                action: 'ki_woocommerce_ajax_add_to_cart',
                product_id: product_id,
                product_sku: '',
                quantity: product_qty,
                variation_id: variation_id,
            }; 
            this.addToCartItem(data, $thisbutton);
        }
    }

    addToCartButton(e) {
        e.preventDefault();

        var parent = jQuery(e.target).closest('.cart-product'),
            product_id = parent.attr('data-pid');
        var data = {
            action: 'ki_woocommerce_ajax_add_to_cart',
            product_id: product_id,
            product_sku: '',
            quantity: 1,
            variation_id: 0,
        }; 
        this.addToCartItem(data, null);
    }

    addToCartItem(data, $button) {
        data['add_mode'] = globals.cartAB;
        jQuery.ajax({
            type: 'post',
            url: wc_add_to_cart_params.ajax_url,
            data: data,
            beforeSend: function (response) {
                if( $button ) {
                    $button.addClass('loading');
                }
                jQuery('.kisc-modal').addClass('modal--loading');
            },
            complete: function (response) {
                if( $button ) {
                    $button.removeClass('loading');
                }
                jQuery('.kisc-modal').removeClass('modal--loading');
            }, 
            success: function (response) { 
                if (response.error & response.product_url) {
                    window.location = response.product_url;
                    return;
                } else { 
                    jQuery(document.body).trigger('added_to_cart', [response, response.cart_hash, $button]);
                } 
            }, 
        });
    }

    addedToCart( e, response, hash, $button ){

        if( globals.cartAB == 0 ) {
            document.location.href =  wc_add_to_cart_params.cart_url;
        }
        else { 
            this.updateFragments( { fragments: response.fragments } );

            if( !jQuery('.kisc-wrap').hasClass('active') ) {
                setTimeout(function() {
                    jQuery('.kisc-wrap').addClass('active');
                    jQuery('body').addClass('kisc-cart-active');
                }, 80);
            }
        }

    }

    updateFragments( response ) {
        if( response.fragments ){
            jQuery.each( response.fragments, function( key, value ) {
                jQuery( ''+key ).html( ''+value );
            });
        }

        jQuery(document.body).trigger( 'wc_fragments_refreshed' );
        jQuery(document.body).trigger("wc_update_cart");
        globals.scartSlideIdx = 0;
    }

    decreaseQty(e) {
        var $target = jQuery(e.target),
            $parent = $target.closest('.kisc-qty');
        this.qtyChangeIncrement($parent, -1);
    }

    increaseQty(e) {
        var $target = jQuery(e.target),
            $parent = $target.closest('.kisc-qty');
        this.qtyChangeIncrement($parent, 1);
    }

    qtyChangeIncrement($parent, increment) {
        var value = parseInt( $parent.find('.qty__number').val() );
        value = value + increment;

        if( value > 0 ) {
            $parent.find('.qty__number').val( value );
            $parent.find('.qty__number').trigger( 'change' );
        }
    }

    updateQtyChanged(e) {
        var thisObj = this,
            $target = jQuery(e.target),
            pkey = $target.closest('.cart-product').attr('data-key'),
            qty = $target.val();

        var data = {
            action: 'ki_update_cart_product',
            item_key: pkey,
            product_id: $target.closest('.cart-product').attr('data-pid'),
            quantity: qty,
            update_action: 'update_qty'
        };

        jQuery.ajax({
            type: 'post',
            url: wc_add_to_cart_params.ajax_url,
            data: data,
            beforeSend: function (response) {
                jQuery('.kisc-modal').addClass('modal--loading');
            },
            complete: function (response) {
                jQuery('.kisc-modal').removeClass('modal--loading');
            }, 
            success: function (response) { 
                if (response.error & response.product_url) {
                    window.location = response.product_url;
                    return;
                } else { 
                    thisObj.updateFragments( { fragments: response.fragments } );
                } 
            }, 
        });
    }
	

    removeCartItem(e) {
        var thisObj = this,
            $target = jQuery(e.target),
            pkey = $target.closest('.cart-product').attr('data-key');

        var data = {
            action: 'ki_update_cart_product',
            item_key: pkey,
            product_id: $target.closest('.cart-product').attr('data-pid'),
            update_action: 'remove'
        };

        jQuery.ajax({
            type: 'post',
            url: wc_add_to_cart_params.ajax_url,
            data: data,
            beforeSend: function (response) {
                jQuery('.kisc-modal').addClass('modal--loading');
            },
            complete: function (response) {
                jQuery('.kisc-modal').removeClass('modal--loading');
            }, 
            success: function (response) { 
                if (response.error & response.product_url) {
                    window.location = response.product_url;
                    return;
                } else { 
                    thisObj.updateFragments( { fragments: response.fragments } );
                } 
            }, 
        });
    }

}


/** Navigation Customization */
class KiierrMenu {

    constructor( ) {
        this.setupMenu();
    }

    setupMenu() {
        jQuery('#et-top-navigation').addClass('topnav-optim');
        jQuery('ul#top-menu').addClass('nav-optim');

        jQuery(document).on('click', '.close-mobile-menu', this.closeMobileMenu.bind(this) );

        this.setupMobile();
    }

    setupMobile() {
        var markup = '<li class="menu-case-b menu-item-contact">';
        markup += '<h3>Do You Need Help?</h3>';
        markup += '<p><i class="fa fa-envelope-o"></i>Email Us:  <a href="mailto:sales@kiierr.com">sales@kiierr.com</a></p>';
        markup += '<p><i class="fa fa-phone"></i>Call Us: <a href="tel:1-801-834-4970">1-801-834-4970</a></p>';
        markup += '</li>';

        jQuery('#mobile_menu').append(markup);
        jQuery('#mobile_menu').append('<span class="close-mobile-menu"></span>');
    }

    closeMobileMenu(e) {
        e.preventDefault();
        e.stopPropagation();
        jQuery('.mobile_menu_bar_toggle').trigger('click');
    }

}

/** Educational Banner */

class KiierrEduBanner {

    constructor( ) {
        this.setupBanner();
    }

    setupBanner() {

        if( jQuery('.edu-banner__ba .comparison-ba').length > 0 ) {

            let mm = gsap.matchMedia();
            mm.add("(min-width: 981px)", () => {
                gsap.to(".edu-banner__ba .comparison-ba", {
                    delay: 1.5,
                    repeatDelay: 0,
                    duration: 37,
                    bottom: -1212,
                    repeat:-1,
                    /*yoyo: true,*/
                    ease: "none"
                });
            });

            let mmob = gsap.matchMedia();
            mmob.add("(max-width: 767px)", () => {
                gsap.to(".edu-banner__ba .comparison-ba", {
                    delay: 1.5,
                    repeatDelay: 0,
                    duration: 37,
                    left: -(194 * 8),
                    repeat:-1,
                    ease: "none"
                });
            });
        }
    }

}

/** END Educational Banner */
/** Educational Banner */

class KiierrEduBanners {

    constructor( ) {
        this.setupBanners();
    }

    setupBanners() {

        if( jQuery('.kiierr-banner__ba .comparison-ba').length > 0 ) {

            let mm = gsap.matchMedia();
            mm.add("(min-width: 981px)", () => {
                gsap.to(".kiierr-banner__ba .comparison-ba", {
                    delay: 1.5,
                    repeatDelay: 0,
                    duration: 37,
                    bottom: -1212,
                    repeat:-1,
                    /*yoyo: true,*/
                    ease: "none"
                });
            });

            let mmob = gsap.matchMedia();
            mmob.add("(max-width: 767px)", () => {
                gsap.to(".kiierr-banner__ba .comparison-ba", {
                    delay: 1.5,
                    repeatDelay: 0,
                    duration: 37,
                    left: -(194 * 8),
                    repeat:-1,
                    ease: "none"
                });
            });
        }
    }

}

/** END Educational Banner */
/** Single PDP Changes (approved B) */
class KIEPDPChanges {
    constructor() {
        this.setupModule();
    }

    setupModule() {
        var thisObj = this;
        if( jQuery('.single-product').length > 0 && jQuery('.pdp-description').length > 0 ) {
            setTimeout(function() {
                if( jQuery('.affirm-as-low-as').length > 0 ) {
                    jQuery('.affirm-as-low-as').clone().addClass('affirm-clone').appendTo('.affirm-clone-wrap');

                    jQuery(document).on( 'DOMSubtreeModified', '.affirm-as-low-as:not(.affirm-clone)', thisObj.affirmDOMChange.bind(thisObj) );
                    jQuery(document).on( 'click', '.affirm-clone-wrap .affirm-modal-trigger', thisObj.affirmModalTrigger.bind(thisObj) );
                }
            }, 500);
        }
    }

    affirmDOMChange() {
        jQuery('.affirm-clone-wrap').html( '' );
        jQuery('.affirm-as-low-as').clone().addClass('affirm-clone').appendTo('.affirm-clone-wrap');
        jQuery('.affirm-clone-wrap').attr('data-changed', 'true');
    }

    affirmModalTrigger() {
        jQuery('.affirm-as-low-as:not(.affirm-clone) .affirm-modal-trigger').click();
    }
}
/** END Single PDP Changes */


/** Cart Module Optimization  */

cartModuleFragments = null;
class KIECartModule {

    constructor( ) {
        const settings = {
			rows: 0,
            slidesToShow: 1,
            centerMode: true,
            prevArrow: '#cart-popup .simple-slider-first .prev-arrow',
            nextArrow: '#cart-popup .simple-slider-first .next-arrow'
        };
        jQuery(document.body).on('wc_fragments_refreshed wc_fragments_loaded', function() {
            jQuery('#cart-popup .simple-slider-first .slider-wrapper:not(.slick-initialized)').slick(settings);
            yotpo.initWidgets();
        });
        jQuery(document).on('mfpOpen', function() {
            console.log('--cart sidebar open---');
            jQuery('#cart-popup .simple-slider-first .slider-wrapper:not(.slick-initialized)').slick(settings);
            setTimeout(function() {
                console.log('--cart sidebar open 2---');
                jQuery('#cart-popup .simple-slider-first .slider-wrapper').slick('refresh');
            }, 300);
        });
        //if( jQuery('.cart-enhance-results').length > 0 ) {
        this.setupModule();
        //}
    }


    setupModule() {
        jQuery(document).on('click', '.products-enhanced-slider .slider__next', function(e) {
            e.preventDefault();
            var totals = jQuery('.products-enhanced-slider .slider__slide').length,
                slideWidth = jQuery('.products-enhanced-slider .slider__slide').width();
    
            if( globals.scartSlideIdx < totals ) {
                globals.scartSlideIdx = (globals.scartSlideIdx + 1) % totals;
                jQuery('.products-enhanced-slider .slider__track').css('transform', 'translateX(-'+(slideWidth * globals.scartSlideIdx)+'px)');
    
                /*if( globals.scartSlideIdx == totals - 1 ) {
                    globals.scartSlideIdx = 0;
                    jQuery('.products-enhanced-slider .slider__next').addClass('disabled');
                }*/
            }
        });
        jQuery(document).on('click', '.products-enhanced-slider .slider__prev', function(e) {
            e.preventDefault();
            var slideWidth = jQuery('.products-enhanced-slider .slider__slide').width();
    
            if( globals.scartSlideIdx >= 0 ) {
                globals.scartSlideIdx--;
                if( globals.scartSlideIdx < 0 ) {
                    globals.scartSlideIdx = jQuery('.products-enhanced-slider .slider__slide').length - 1;
                }
                jQuery('.products-enhanced-slider .slider__track').css('transform', 'translateX(-'+(slideWidth * globals.scartSlideIdx)+'px)');
    
                /*if( globals.scartSlideIdx == 0 ) {
                    jQuery('.products-enhanced-slider .slider__prev').addClass('disabled');
                }*/
            }
        });
        jQuery(window).resize(function() {
            globals.scartSlideIdx = 0;
            jQuery('.products-enhanced-slider .slider__track').css('transform', '');
        });

        jQuery(document.body).on( 'click', '.kisc-wrap--inline .add-to-cart-opt', this.addToCartButton.bind(this) );
    }

    addToCartButton(e) {
        e.preventDefault();
        e.stopPropagation();

        var parent = jQuery(e.target).closest('.cart-product'),
            product_id = parent.attr('data-pid');
        var data = {
            action: 'ki_woocommerce_ajax_add_to_cart',
            product_id: product_id,
            product_sku: '',
            quantity: 1,
            variation_id: 0,
        }; 
        this.addToCartItem(data, null);
    }

    addToCartItem(data, $button) {
        jQuery.ajax({
            type: 'post',
            url: wc_add_to_cart_params.ajax_url,
            data: data,
            beforeSend: function (response) {
                if( $button ) {
                    $button.addClass('loading');
                }
                jQuery('.kisc-wrap--inline').addClass('is-loading');
            },
            complete: function (response) {
                if( $button ) {
                    $button.removeClass('loading');
                }
                jQuery('.kisc-wrap--inline').removeClass('is-loading');
            }, 
            success: function (response) { 
                if (response.error) {
                    console.log('KIE add to cart error');
                } else {
                    cartModuleFragments = response.fragments;
                    jQuery(document.body).trigger("wc_update_cart");
					jQuery(document.body).trigger("wc_fragment_refresh");
                } 
            }, 
        });
    }

}

/** END Cart Module Optimization  */

/** One time purchase Options  */

class KIEOTOptions {

    constructor( ) {
        if( jQuery('.single-product').length > 0 && jQuery('.c-ot-options').length > 0 && jQuery('.ot-product-b').length > 0 ) {
            this.setupModule();
        }
    }

    setupModule() {
        setTimeout(function() {
            if( jQuery('.c-variant.is-active').length > 0 ) {
                var attrVal = jQuery('.c-variant.is-active').attr('data-attr-val');
                jQuery('.variations input[value="'+ attrVal +'"]').trigger('click');

                var subscribePar = jQuery('.ot-subscribe-link');
                if( subscribePar.length > 0 ) {
                    subscribePar.closest('p').addClass('ot-subscribe-link-p');
                }
            }
        }, 300);

        if( jQuery('.single-product .woocommerce-product-details__short-description ul').length > 0 ) {
            jQuery('.single-product .woocommerce-product-details__short-description ul').appendTo( '.ot-product__bottom' );
        }

        jQuery(document).on( 'click', '.single-product .c-variant', this.changeVariant.bind(this)  );
        /*jQuery(document).on( 'click', '.single-product .prod-option', this.changeOTOption.bind(this)  )*/
    }

    changeVariant(e) {
        var target = e.target,
            variant = jQuery(target).closest('.c-variant');

        if( variant ) {
            jQuery('.single-product .c-variant').removeClass('is-active');
            variant.addClass('is-active');

            var attrVal = variant.attr('data-attr-val'),
                varPrice = variant.find('.variation__price span').text(),
                bottleQty = variant.attr('data-bottle-qty');

            if( attrVal && varPrice ) {

                jQuery('.prod-options .prod-option p span').text( varPrice );
                jQuery('.variations input[value="'+ attrVal +'"]').trigger('click');

                if( bottleQty == '1' ) {
                    jQuery('.prod-options .prod-option p small').addClass('is-hidden');
                }
                else {
                    jQuery('.prod-options .prod-option p small').removeClass('is-hidden');
                }
            }
        }

    }

    changeOTOption(e) {
        var target = e.target,
            option = jQuery(target).closest('.prod-option');

        if( option ) {
            jQuery('.prod-options .prod-option').removeClass('is-checked');
            option.addClass('is-checked')
        }
    }
}

/** END One time purchase Options  */

/** PLP Overhaul V2 */
var OVLWindowW = jQuery(window).width();
class PLPOverhaulV2 {

    constructor( ) {
        this.setupPLP();
    }

    setupPLP() {

        jQuery(document).on('click', '.plp-card__dpdn-btn', this.openCloseDropdown.bind(this) );
        jQuery(document).on('click', '.dpdn-variants__close', this.openCloseDropdown.bind(this) );

        jQuery(document).on( 'change', '.plp-dpdn-variants .variant__radio input[type="radio"]', this.chooseVariantChange.bind(this) );

    }

    openCloseDropdown(e) {
        e.preventDefault();
        var parent = jQuery(e.target).closest('.plp-dpdwn-btm');
        parent.find('.plp-dpdn-variants').toggleClass('is-active');
    }

    chooseVariantChange(e) {
        var target = jQuery(e.target),
            parent = target.closest('.plp-dpdn-variants'),
            variantId = target.val(),
            variantPrice = target.attr('data-price');

        if( variantId && variantPrice ) {
            parent.find('.variant__add-to-cart').attr('href', wc_add_to_cart_params.cart_url + '?add-to-cart=' + variantId + '&quantity=1' );
            parent.find('.variant__add-to-cart span').html(variantPrice);
        }
    }
}
/** END PLP Overhaul V2 */

/** New PDP - laser cap */

var pdp_variant = null;
class NewPDPLaserCap {

    constructor( ) {
        if( jQuery('.single-product').length > 0 ) {
            var thisObj = this;
            if( jQuery('.attrs-wrap').length > 0 ) {
                this.setupVariantsModule();
            }
            if( jQuery('.pdp-thumbnails').length > 0 ) {
                this.setupImageWidget();
            }
            if( jQuery('.pdp-upsells').length > 0 ) {
                jQuery(document).on( 'click', '.pdp-upsells .upsell-box', this.upsellBoxClickEvent.bind(this)) ;
                jQuery(document).on( 'change', '.pdp-upsells .upsell-box input[type="checkbox"]', this.upsellEnhanceProductChange.bind(this) );
                jQuery('body').on( 'found_variation', function(e, variation) {
                    pdp_variant = variation;
                    //alert( 'precios: ' +  variation.display_price + '-' + variation.display_regular_price + '-' + variation.price_html );
                    setTimeout(function() {
                        thisObj.updateTotalPrices();
                    }, 100);
                } );
            }
            if( jQuery('.tabs-panel').length > 0 ) {
                this.setupTabs();
            }
        }
    }

    setupVariantsModule() {
        jQuery(document).on( 'click', '.single-product .attr-box', this.chooseAttribute.bind(this)  );

        setTimeout(function() {
            jQuery('.cfvsw-swatches-container .cfvsw-swatches-option.cfvsw-selected-swatch').each(function(idx, el) { 
                var slug = jQuery(el).attr('data-slug');
                var target = jQuery('.attrs-wrap .attr-box[data-slug="'+slug+'"]'),
                    parent = null;
                    
                if( target.length > 0 ) {
                    parent = target.closest('.attr-grid');
                    parent.find('.attr-box').removeClass('is-active');
                    target.addClass('is-active');
                }
            });
        }, 250);
    }

    setupImageWidget() {
        var thisObj = this;
        setTimeout(function() {
            jQuery('.pdp-thumbnails').appendTo('.woocommerce-product-gallery');
            var srcImage = jQuery('.woocommerce-product-gallery__image img').attr('src');
            if( srcImage ) {
                jQuery('.pdp-thumbnails .sp-slider-preview img').attr('src', srcImage);
            }

            /*if( jQuery('.woo-product-gallery-slider #slick-slide00 img').length > 0 ) {
                jQuery('.woo-product-gallery-slider #slick-slide00 img').addEventListener( 'DOMAttrModified', function(e) {
                    thisObj.mainImageModified(e, thisObj);
                } );
            }*/
        }, 500);

        jQuery(document).on( 'click', '.sp-thumb-slider .sp-slider__slide', this.imageThumbClick.bind(this) );
        jQuery(document).on( 'click', '.sp-thumb-slider .sp-slider__prev', this.thumbsClickPrev.bind(this) );
        jQuery(document).on( 'click', '.sp-thumb-slider .sp-slider__next', this.thumbsClickNext.bind(this) );
    }

    setupTabs() {
        jQuery(document).on('click', '.tabs-panel .tabs__nav a', this.tabsNavClick.bind(this)  );
        jQuery(document).on('click', '.faqs-block .faq-item__heading', this.faqAccordionCLickEvent.bind(this)  );

        if( jQuery('#lacer_caps_baf_slider').length > 0 ) {
            jQuery('#lacer_caps_baf_slider').slick({
                dots: true,
                infinite: true,
                slidesToShow: 2,
                slidesToScroll: 1,
                responsive: [
                    {
                        breakpoint: 601,
                        settings: {
                            slidesToShow: 1,
                            slidesToScroll: 1,
                        }
                    }
                ]
            });
        }
        if( jQuery('#how_works_slider').length > 0 ) {
            jQuery('#how_works_slider').slick({
                dots: true,
                infinite: true,
                slidesToShow: 1,
                slidesToScroll: 1,
            });
        }
    }

    chooseAttribute(e) {
        var thisObj = this;
        var target = e.target,
            attrBox = jQuery(target).closest('.attr-box'),
            parent = null,
            attrSlug = null;

        if( attrBox.length > 0 ) {
            parent = attrBox.parent();
            
            parent.find('.attr-box').removeClass('is-active');
            attrBox.addClass('is-active');

            attrSlug = attrBox.attr('data-slug');

            if( attrSlug ) {
                jQuery('.variations .cfvsw-swatches-option[data-slug="'+ attrSlug +'"]').trigger('click');

                setTimeout(function() {
                    thisObj.updateMainThumbnailImage();
                }, 500);
            }
        }
    }

    imageThumbClick(e) {
        var slide = jQuery(e.target).closest('.sp-slider__slide'),
            idx = 0;
        if( slide.length > 0 ) {
            idx = slide.index();
            jQuery('.woocommerce-product-gallery .flex-control-nav li:eq('+idx+') img, .woocommerce-product-gallery .flex-control-nav li:eq('+idx+') a').trigger('click');

            jQuery('.pdp-thumbnails .sp-slider__inner .sp-slider__slide').removeClass('is-active');
            jQuery('.pdp-thumbnails .sp-slider__inner .sp-slider__slide:eq('+idx+')').addClass('is-active');
        }
    }

    thumbsClickPrev() {
        var curIdx = jQuery('.pdp-thumbnails .sp-slider__inner').attr('data-current');
        if( curIdx ) {
            curIdx = parseInt(curIdx);
            curIdx = curIdx - 1;
            if( curIdx >= 0 ) {
                this.gotoImageThumbnail(curIdx, false);
            }
        }
    }
    thumbsClickNext() {
        var curIdx = jQuery('.pdp-thumbnails .sp-slider__inner').attr('data-current'),
            slidesLength = jQuery('.pdp-thumbnails .sp-slider__inner .sp-slider__slide').length;
        if( curIdx ) {
            curIdx = parseInt(curIdx); 
            curIdx = curIdx + 1;
            if( curIdx >= slidesLength - 3 ) {
                curIdx = 0;
            }
            if( curIdx < slidesLength ) {
                this.gotoImageThumbnail(curIdx, false);
            }
        }
    }
    gotoImageThumbnail(idx, select) {
        var slideWidth = jQuery('.pdp-thumbnails .sp-slider__inner .sp-slider__slide').outerWidth() + 8,
            leftPos = slideWidth * idx;

        jQuery('.pdp-thumbnails .sp-slider__inner').attr('data-current', ''+idx);

        if( select == true ) {
            jQuery('.pdp-thumbnails .sp-slider__inner .sp-slider__slide').removeClass('is-active');
            jQuery('.pdp-thumbnails .sp-slider__inner .sp-slider__slide:eq('+idx+')').addClass('is-active');
        }

        if( idx == 0 ) {
            jQuery('.pdp-thumbnails .sp-slider__inner').css('transform', 'none');
        }
        else {
            jQuery('.pdp-thumbnails .sp-slider__inner').css('transform', 'translateX(-'+leftPos+'px)');
        }
    }

    updateMainThumbnailImage() {
        if( jQuery('.woocommerce-product-gallery__wrapper div:eq(0) > img').length > 0 ) {
            var srcImage = jQuery('.woocommerce-product-gallery__wrapper div:eq(0) img').attr('src');
            if(  jQuery('.pdp-thumbnails').length > 0 ) {
                jQuery('.pdp-thumbnails .sp-slider__slide[data-idx="0"] img').attr('src', srcImage);

                this.gotoImageThumbnail(0, true);
            }
        }
    }

    tabsNavClick(e) {
        e.preventDefault();
        e.stopPropagation();

        var target = jQuery(e.target).attr('data-target'),
            idx = jQuery(e.target).attr('data_idx'),
            parent = null;
        if( jQuery(target).length > 0 ) {
            parent = jQuery(target).closest('.tabs-panel');
            parent.find('.tabs__body .tabs__tab-content, .tabs__nav a').removeClass('is-active');

            jQuery('.tabs__nav a[data-target='+target+']').addClass('is-active');
            jQuery(target).addClass('is-active');

            if( idx == '0' ) {
                jQuery('#lacer_caps_baf_slider').slick('slickGoTo', 0);
            }
            else if( idx == '2' ) {
                jQuery('#how_works_slider').slick('slickGoTo', 0);
            }
        }
    }

    faqAccordionCLickEvent(e) {
        e.preventDefault();
        var accordItem = jQuery(e.target).closest('.faq-item');
        if( accordItem.length > 0 ) {
            accordItem.toggleClass('is-active');
        }
    }

    upsellBoxClickEvent(e) {
        var target = jQuery(e.target),
            type = target.attr('type');
        if( !type || type == undefined ) {
            e.preventDefault();

            if( !target.hasClass('.upsell-box') ) {
                target = target.closest('.upsell-box');
            }

            if( target.length > 0 ) {
                target.find('input[type="checkbox"]').trigger('click');
            }
        }
    }
    upsellEnhanceProductChange(e) {
        var results = [],
            thisObj = this;
        jQuery('.pdp-upsells .upsell-box input[type="checkbox"]').each(function(idx, el) {
            if( el.checked ) {
                results.push(el.value);
            }
        });
        var values = results.join(',');
        jQuery('#pdp_upsells_field').val(values);

        setTimeout(function() {
            thisObj.updateTotalPrices();
        }, 100);
    }

    updateTotalPrices() {
        if( pdp_variant != null ) {
            var deltaPrice = 0,
                auxPrice = 0,
                auxPrice2 = 0;
            jQuery('.pdp-upsells .upsell-box input[type="checkbox"]').each(function(idx, el) {
                if( el.checked ) {
                    auxPrice = el.getAttribute('data-price');
                    auxPrice = parseFloat(auxPrice);
                    deltaPrice += auxPrice;
                }
            });

            const numberFormatter = new Intl.NumberFormat('en-US', {
                style: 'decimal',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
            if( pdp_variant.display_price == pdp_variant.display_regular_price ) {
                auxPrice = pdp_variant.display_price + deltaPrice;
                auxPrice = numberFormatter.format(auxPrice);

                jQuery('.woocommerce-variation .woocommerce-Price-amount bdi').html('<span class="woocommerce-Price-currencySymbol aa">$</span>' + auxPrice);
            }
            else {
                auxPrice = pdp_variant.display_price + deltaPrice;
                auxPrice2 = pdp_variant.display_regular_price + deltaPrice;

                auxPrice = numberFormatter.format(auxPrice);
                auxPrice2 = numberFormatter.format(auxPrice2);

                jQuery('.woocommerce-variation .woocommerce-variation-price ins bdi').html('<span class="woocommerce-Price-currencySymbol">$</span>' + auxPrice);
                jQuery('.woocommerce-variation .woocommerce-variation-price del bdi').html('<span class="woocommerce-Price-currencySymbol">$</span>' + auxPrice2);
            }
        }
    }
}

/** END New PDP - laser cap */

class KIESingleProductBehavior {

    constructor( ) {
        if( jQuery('.single-product').length > 0 &&  typeof sp_mob_images != 'undefined' ) {
            jQuery(document).on('woocommerce_variation_select_change', this.variationUpdated.bind(this) );
        }
    }

    variationUpdated() {
        var thisObj = this;
        setTimeout(function() {
            var $image = jQuery('.woocommerce-product-gallery__wrapper div[data-thumb]:first-child a > img'),
                imageUrl = $image.attr('data-large_image'),
                imageData = null

            if( imageUrl ) {
                imageData = thisObj.findMobileImageData( imageUrl );

                if( imageData ) {
                    $image.attr('sizes', imageData['sizes'] );
                    $image.attr('srcset', imageData['srcset'] );
                    $image.attr('src', imageData['data-src'] );
                }
            }
        }, 350);
    }

    findMobileImageData(imageUrl) {
        var result = null;
        sp_mob_images.forEach((data) => {
            if( data['image_url'] == imageUrl ) {
                result = data;
            }
        });
        return result;
    }
}

class KIEPromoBanner {

    constructor( ) {
        if( jQuery('.promo-banner .promo-counters').length > 0 ) {
            var thisObj = this;
            this.totalTime = parseInt( jQuery('.promo-banner .promo-counters').attr('data-seconds') );
            this.intervalID = setInterval(function() {
                thisObj.countdownTimer();
            }, 1000);
        }
    }

    countdownTimer() {
        this.totalTime = this.totalTime - 1;

        var hours = Math.floor((this.totalTime  % ( 60 * 60 * 24)) / ( 60 * 60));
        var minutes = Math.floor((this.totalTime  % ( 60 * 60)) / ( 60));
        var seconds = Math.floor((this.totalTime  % ( 60)) / 1);

        jQuery('.promo-banner .promo-counters [data-id="pb-hr"]').html(''+hours);
        jQuery('.promo-banner .promo-counters [data-id="pb-min"]').html(''+minutes);
        jQuery('.promo-banner .promo-counters [data-id="pb-sec"]').html(''+seconds);

        if( this.totalTime < 0 ) {
            jQuery('.promo-banner').addClass('hidden');
            clearInterval( this.intervalID );
        }
    }


}

class ExclusiveOfferPDP {
    constructor() {
      this.initImageSlider();

      if( jQuery('.pdp-offer-block .variants-pdp').length > 0 ) {
        jQuery(document).on( 'click', '.pdp-offer-block .variants-pdp__item', this.chooseAttribute.bind(this) );
        jQuery(document).on( 'click', '.pdp-offer-block .single_add_to_cart_button', this.buyClick.bind(this) );
      }
    }
  
    initImageSlider() {
        if (jQuery('#sec-offer-pdp__slider').length > 0 && jQuery('#sec-offer-pdp__slider-nav').length > 0) {
            jQuery('#sec-offer-pdp__slider').slick({
                slidesToShow: 1,
                slidesToScroll: 1,
                autoplay: false,
                autoplaySpeed: 2000,
                dots: true,
                arrows: true,
            });
            jQuery('#sec-offer-pdp__slider-nav').slick({
                slidesToShow: 4,
                slidesToScroll: 1,
                asNavFor: '#sec-offer-pdp__slider',
                dots: false,
                focusOnSelect: true,
                arrows: false
            });
            
            jQuery('#sec-offer-pdp__slider').on('afterChange', function(event, slick, currentSlide){
                var $navSlides = jQuery('#sec-offer-pdp__slider-nav .slick-slide');
                $navSlides.removeClass('slick-current');
                $navSlides.eq(currentSlide).addClass('slick-current');
            });
        }
    }

    chooseAttribute(e) {
        var thisObj = this;
        var target = e.target,
            attrBox = jQuery(target).closest('.variants-pdp__item'),
            parent = null,
            attrPrice = null,
            attrRegPrice = null;

        if( attrBox.length > 0 ) {
            parent = attrBox.parent();
            
            parent.find('.variants-pdp__item').removeClass('is-active');
            attrBox.addClass('is-active');
            attrPrice = attrBox.attr('data-price');
            attrRegPrice = attrBox.attr('data-rprice');

            if( attrPrice ) {
                jQuery('.pdp-offer-block .single_add_to_cart_button .pdp-price').html(''+attrPrice);
                jQuery('.pdp-offer-block .single_add_to_cart_button del').html(''+attrRegPrice);
            }
        }
    }

    buyClick(e) {
        e.stopPropagation();
        var cartUrl = jQuery(e.target).attr('data-url');
        var attrId = jQuery('.pdp-offer-block  .variants-pdp__item.is-active').attr('data-pid');

        if( cartUrl && attrId ) {
            window.location.href = cartUrl + '?add-to-cart='+attrId+'&quantity=1';
        }
    }
}

class ReadMoreToggle {
    constructor() {
        this.init();
    }

    init() {
        if (jQuery('.read-more__toggle').length) {
            jQuery('.read-more__toggle').on('click', (event) => {
                event.preventDefault();
                const readMoreContainer = jQuery(event.currentTarget).closest('.read-more');
                readMoreContainer.toggleClass('active');
    
                if (readMoreContainer.hasClass('active')) {
                    jQuery(event.currentTarget).text('Read Less');
                    jQuery(event.currentTarget).attr('aria-expanded', 'true');
                } else {
                    jQuery(event.currentTarget).text('... Read More');
                    jQuery(event.currentTarget).attr('aria-expanded', 'false');
                }
                jQuery('.flickity-enabled').flickity('resize');
            });
        }
    }
}
jQuery(document).ready(function ($) {
    $(document).on("click", ".cfvsw-swatches-option", function (e) {
        let parent = $(this).closest(".cfvsw-swatches-container");

        // Ensure parent exists before modifying it
        if (!parent.length) {
            console.error("Parent container not found.");
            return;
        }

        // Check if the clicked swatch is already selected
        if ($(this).hasClass("cfvsw-selected-swatch")) {
            e.preventDefault(); // Prevents deselection
            return false; // Stops further execution
        }

        // Remove selected class from other swatches
        parent.find(".cfvsw-swatches-option").removeClass("cfvsw-selected-swatch");
        $(this).addClass("cfvsw-selected-swatch");
    });
});