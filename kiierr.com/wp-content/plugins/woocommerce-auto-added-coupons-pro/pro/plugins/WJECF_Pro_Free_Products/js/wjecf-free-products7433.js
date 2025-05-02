if ( undefined !== jQuery ) {
	jQuery( function($) {
		var get_url = function( endpoint ) {
			return wc_cart_params.wc_ajax_url.toString().replace(
				'%%endpoint%%',
				endpoint
			);
		};

		/**
		 * Find the form 'update cart'-submit button.
		 * 
		 * @param {Element|jQuery} context A DOM Element, Document, or jQuery to use as context
		 */
		var get_cart_form_submit_button = function( context ) {
			//context is optional
			var input_button = $( 'form.woocommerce-cart-form :submit[name="update_cart"]', context ); //WC3.0+
			if (input_button.length == 0) input_button = $( 'div.woocommerce form input[name="update_cart"]', context ); //Flatsome theme
			return input_button;
		}

		/**
		 * Find the woocommerce cart form.
		 * 
		 * @param {Element|jQuery} context A DOM Element, Document, or jQuery to use as context
		 */
		var get_cart_form = function( context ) {
			return get_cart_form_submit_button( context ).closest("form");
		}

		/**
		 * Check if a node is blocked for processing.
		 *
		 * @param {JQuery Object} $node
		 * @return {bool} True if the DOM Element is UI Blocked, false if not.
		 */
		var is_blocked = function( $node ) {
			return $node.is( '.processing' ) || $node.parents( '.processing' ).length;
		};

		//Cart selection handler
		function wjecf_cart_select_free_product() {
			var me = this;

			/**
			 * The free product-coupons of the currently displayed cart (comma separated string, from cookie wjecf_free_product_coupons)
			 */
			var applied_free_product_coupons = undefined;

			me.init = function() {
				//Update shipping method could trigger auto coupon. Therefore check if cart must be updated
				me.applied_free_product_coupons = Cookies.get('wjecf_free_product_coupons');
				$ (document ).on('updated_shipping_method', me.maybe_update_cart);

				//Enable 'submit'-button after changing free-product selection
				$( document ).on(
					'change input',
					'.wjecf-select-free-products :input',
					me.input_changed
				);

				//Auto submit free product selection if contained in .wjecf-auto-submit
				$( document ).on(
					'change input',
					'.wjecf-auto-submit :input:radio, .wjecf-auto-submit :input:checkbox',
					function( evt ) {
						//Don't auto-submit if not all attributes are selected
						if ( $( evt.currentTarget ).closest("[data-wjecf-free-product-group]:has(.variations select option[value='']:selected)").length > 0 ) return;

						me.ajax_update_cart();
					}
				);

				//Auto submit attribute selection if contained in .wjecf-auto-submit
				$( document ).on(
					'change input',
					'.wjecf-auto-submit select',
					function( evt ) {
						//Find the input-box that is used to select the free product
						var selector = $( evt.currentTarget ).closest("[data-wjecf-free-product-group]").data('wjecf-free-product-group');
						if (selector !== undefined) {
							selector = $("#" + selector);

							//Don't auto-submit if not all attributes are selected
							if ( $( evt.currentTarget ).closest("[data-wjecf-free-product-group]:has(.variations select option[value='']:selected)").length > 0 ) return;

							//Don't auto-submit on attribute selection if the product isn't selected
							if ( selector.is(":radio") && ! selector.is(":checked") ) return;
							if ( selector.is(":checkbox") && ! selector.is(":checked") ) return;
							if ( selector.is("[type=number]") && parseInt( selector.val() ) <= 0 ) return;
						}
						me.ajax_update_cart();
					}
				);
			};

			/**
			 * Submit the form and update contents via ajax.
			 */
			me.ajax_update_cart = function() {
				var $form = get_cart_form();
				if ( ! $form.length ) {
					console.log('ajax_update_cart: Unable to find form');
					return;
				}

				var $button = get_cart_form_submit_button();
				if ( ! $button.length ) {
					console.log('ajax_update_cart: Unable to submit button');
					return;
				}

				//Form is blocked; probably already a request pending...
				if ( is_blocked( $form ) ) return;

				$button.trigger("click"); 
			}

			/**
			 * Compare cookie with previous version to detect changes to the applied free-product-coupons
			 */
			me.maybe_update_cart = function() {
				var new_free_product_coupons = Cookies.get('wjecf_free_product_coupons');
				if (new_free_product_coupons != me.applied_free_product_coupons) {
					//console.log("Situation changed from " + applied_free_product_coupons + " to " + new_free_product_coupons);
					me.applied_free_product_coupons = new_free_product_coupons;
					me.ajax_update_cart(); //display/remove free product in cart
				}
			};

			/**
			 * After an input has changed, enabled the update cart button.
			 */
			me.input_changed = function() {
				get_cart_form_submit_button().prop( 'disabled', false );
			}

			return me;
		}
		//End Cart selection handler

		//Totalizer handler
		//A totalizer will sum up the values of all inputs that share the same 'data-wjecf-qty-totalizer' attribute
		//A (hidden) input with that name should exist 
		//The hidden input can have an 'wjecf-qty-max'-attribute to limit the sum to the given max value
		function wjecf_totalizer_handler() {
			var me = this;

			/**
			 * Initializes the totalizer handler
			 * @return void
			 */
			me.init = function() {
				me.update_all_totalizers();
				$( document ).on(
					'change input',
					'*[data-wjecf-qty-totalizer]',
					me.input_changed );
			}

			/**
			 * After an input has changed, update the totalizer.
			 * @param Event e 
			 * @return void
			 */
			me.input_changed    = function( e ) {
				me.update_totalizer( e.target.getAttribute('data-wjecf-qty-totalizer'), e.target );
			};

			/**
			 * Update the values of all totalizers
			 * @return void
			 */
			me.update_all_totalizers = function() {
				var totalizer_ids = {};
				$( '*[data-wjecf-qty-totalizer]' ).each(function(){
					var totalizer_id = this.getAttribute('data-wjecf-qty-totalizer')
					totalizer_ids[totalizer_id] = totalizer_id;
				});
				for(var totalizer_id in totalizer_ids) {
					me.update_totalizer( totalizer_id );
				}
			}

			/**
			 * Update the totalizer with the given id.
			 * If updated_input is given; the value will be limited to be <= max_value
			 *
			 * @param string totalizer_id 
			 * @param object updated_input The updated DOM-element
			 */
			me.update_totalizer = function( totalizer_id, updated_input ) {
				if ( undefined == totalizer_id ) return;

				var is_checkbox = function( element ) {
					return element.type && element.type === 'checkbox';
				}

				var set_totalizer_value = function( element, value ) {
					if ( element === undefined ) return;
					if ( element.tagName.toLowerCase() === 'input' )
						element.value = value;
					else
						element.textContent = value;
				}                            

				/**
				 * Get quantity from a DOM-element (input type="number", "checkbox" or "radio")
				 * @param object element 
				 * @return quantity
				 */
				var get_quantity = function( element ) {
					if ( is_checkbox( element ) ) return element.checked ? 1 : 0;

					// assume numeric input
					return 1*$(element).val();
				}

				//Calculate total
				var total = 0;
				$( '*[data-wjecf-qty-totalizer="' + totalizer_id + '"]' ).each(function(){
					total += get_quantity( this );
				});


				//Max value?
				var totalizer = $( '#' + totalizer_id );
				var max_quantity = totalizer.data('wjecf-qty-max');

				//Set max value for all inputs
				if ( undefined !== max_quantity ) {
					//Limit updated_input to the max value
					$( '*[data-wjecf-qty-totalizer="' + totalizer_id + '"]' ).each(function(){
						var old_value = get_quantity( this );
						//Max allowed amount for this input
						var max_left = Math.max( 0, max_quantity - total  + get_quantity( this ) );

						if ( this === updated_input && old_value > max_left) {
							if ( is_checkbox( this ) ) {
								this.checked &= max_left > 0; //uncheck if too many
							} else {
								$(this).val( Math.min( max_left, $(this).val() ) ); //limit the value
							}
							total += get_quantity( this ) - old_value;
						}

						// if ( ! is_checkbox( this ) ) {
						//     $(this).attr({"max":max_left});
						// }
					});
				}

				set_totalizer_value( totalizer.get(0), total );
			}

			return me;
		}
		//End Totalizer handler

		// wc_cart_params is required to continue, ensure the object exists
		if ( typeof wc_cart_params !== 'undefined' ) {
			wjecf_cart_select_free_product().init();
		}

		wjecf_totalizer_handler().init();
	});
}
