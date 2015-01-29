/**
 * cosyValidator
 * @author Jan Ebsen <xicrow@gmail.com>
 * @version 1.0.0
 * @date 2014-02-06
 * @copyright Jan Ebsen 2014
 */
(function($){
	// cosyValidator object
	$.cosyValidator = {
		// Default options
		defaultOptions : {
			validateOnInit : false,
			validateOnSubmit : true,
			validateOnReset : false,
			errorContainerClassName : '',
			rules : {},
			messages : {}
		},
		
		init : function(form, options){
			// Extends options with default options
			options = $.extend({}, $.cosyValidator.defaultOptions, options);
			
			if (options.validateOnInit){
				$.cosyValidator.validateForm(form, options);
			}
			
			if (options.validateOnSubmit){
				// Bind submit handler for the form
				$(form).on('submit', function(){
					return $.cosyValidator.validateForm(this, options);
				});
			}
			
			// Bind reset handler for the form
			$(form).on('reset', function(){
				$(form).find('.cosyValidator-error').remove();
				$(form).find('.cosyValidator-valid').removeClass('cosyValidator-valid');
				$(form).find('.cosyValidator-invalid').removeClass('cosyValidator-invalid');
				
				if (options.validateOnReset){
					//$.cosyValidator.validateForm(this, options);
					window.cosyValidatorForm = this;
					window.cosyValidatorOptions = options;
					setTimeout(function(){ $.cosyValidator.validateForm(cosyValidatorForm, cosyValidatorOptions); }, 1);
				}
			});
			
			if (options.rules){
				$.each(options.rules, function(name, rules){
					$(form).find('[name='+name+']').on({
						/*
						focus : function(){
							$.cosyValidator.validateElement(form, name, options);
						},
						*/
						blur : function(){
							$.cosyValidator.validateElement(form, name, options);
						},
						/*
						keydown : function(){
							$.cosyValidator.validateElement(form, name, options);
						},
						*/
						keyup : function(){
							$.cosyValidator.validateElement(form, name, options);
						},
						change : function(){
							$.cosyValidator.validateElement(form, name, options);
						}
					});
				});
			}
		},
		
		validateForm : function(form, options){
			var isValid = true;
			
			if (options.rules){
				$.each(options.rules, function(name, rules){
					result = $.cosyValidator.validateElement(form, name, options);
					if (!result){
						isValid = false;
					}
				});
			}
			
			return isValid;
		},
		
		validateElement : function(form, name, options){
			var element = $(form).find('[name='+name+']');
			if (element.length == 0){
				var element = $(form).find('[name^='+name+']');
				if (element.length == 0){
					if (window.console){
						console.log("Undefined element in form "+form+" with name "+name+".");
					}
					
					return false;
				}
			}
			
			var elementValue = element.val();
			var elementErrorContainer = $('.cosyValidator-error-'+name);
			if (!elementErrorContainer.length){
				elmAppendTo = element.parent();
				if (element.parent()[0].nodeName.toLowerCase() == 'label'){
					elmAppendTo = element.parent().parent();
				}
				else if (element.parent()[0].nodeName.toLowerCase() == 'div' && element.parent()[0].className == 'input-group'){
					elmAppendTo = element.parent().parent();
				}
				
				elementErrorContainer = $('<div></div>')
					.addClass('cosyValidator-error')
					.addClass('cosyValidator-error-'+name)
					.appendTo(elmAppendTo)
					.hide();
				
				if (options.errorContainerClassName != ''){
					elementErrorContainer.addClass(options.errorContainerClassName);
				}
			}
			var elementErrorMessage = '';
			
			var rules = (options.rules[name] || {});
			var messages = (options.messages[name] || {});
			
			for (method in rules){
				rule = {
					method : method,
					parameters : rules[method]
				};
				
				try{
					if (!$.cosyValidator.methods[method].call(this, elementValue, element[0], rule.parameters)){
						elementErrorMessage = (messages[method] ? this.sprintf(messages[method], rule.parameters) : this.sprintf($.cosyValidator.messages[method], rule.parameters));
						break;
					}
				}
				catch(e){
					if (window.console){
						console.log("Exception occurred when checking element "+element.id+", check the '"+rule.method+"' method.", e);
					}
					
					throw e;
				}
			}
			
			if (elementErrorMessage != ''){
				element.removeClass('cosyValidator-valid');
				element.addClass('cosyValidator-invalid');
				
				if (elementErrorContainer.html() != elementErrorMessage){
					elementErrorContainer.html(elementErrorMessage);
				}
				
				if (elementErrorContainer.is(':animated') || !elementErrorContainer.is(':visible')){
					//elementErrorContainer.show();
					elementErrorContainer.stop(true, true).slideDown(250);
				}
				
				return false;
			}
			else{
				element.removeClass('cosyValidator-invalid');
				element.addClass('cosyValidator-valid');
				
				if (elementErrorContainer.is(':animated') || elementErrorContainer.is(':visible')){
					//elementErrorContainer.hide();
					elementErrorContainer.stop(true, true).slideUp(250);
				}
				
				return true;
			}
			
			return true;
		},
		
		elementIsCheckable : function(element){
			return (/radio|checkbox/i).test(element.type);
		},
		
		elementGetLength : function(element){
			if (element.nodeName.toLowerCase() == 'select'){
				return $('option:selected', element).length;
			}
			else if (element.nodeName.toLowerCase() == 'input' && this.elementIsCheckable(element)){
				//return this.findByName(element.name).filter(":checked").length;
				
				return $('[name='+element.name+']').filter(":checked").length;
			}
			
			return $.trim($(element).val()).length;
		},
		
		sprintf : function(format){
			var arg = arguments;
			if (typeof(arg[1]) == 'undefined'){
				return format;
			}
			
			var i = 1;
			if (typeof(arg[1]) == 'object' || typeof(arg[1]) == 'array'){
				arg = arg[1];
				i = 0;
			}
			
			return format.replace(/%((%)|s)/g, function(m){
				return arg[i++];
			});
		}
	};
	
	$.cosyValidator.messages = {
		required : "Feltet er påkrævet",
		email : "Skriv venligst en gyldig e-mail adresse",
		url : "Skriv venligst en gyldig URL",
		date : "Skriv venligst en gyldig dato",
		dateISO : "Skriv venligst en gyldig dato (ISO)",
		number : "Skriv venligst en gyldig tal",
		digits : "Skriv venligst kun tal",
		minlength : $.cosyValidator.sprintf("Skriv venligst mindst %s tegn"),
		maxlength : $.cosyValidator.sprintf("Skriv venligst ikke flere end %s tegn"),
		rangelength : $.cosyValidator.sprintf("Skriv venligst mellem %s og %s tegn langt"),
		min : $.cosyValidator.sprintf("Skriv et tal mindre end eller lig med %s"),
		max : $.cosyValidator.sprintf("Skriv et tal større end eller lig med %s"),
		range : $.cosyValidator.sprintf("Skriv et tal mellem %s og %s"),
		equalTo : "Skriv venligst den samme værdi igen"
		/*
		required : "This field is required.",
		email : "Please enter a valid email address.",
		url : "Please enter a valid URL.",
		date : "Please enter a valid date.",
		dateISO : "Please enter a valid date (ISO).",
		number : "Please enter a valid number.",
		digits : "Please enter only digits.",
		minlength : $.cosyValidator.sprintf("Please enter at least %s characters."),
		maxlength : $.cosyValidator.sprintf("Please enter no more than %s characters."),
		rangelength : $.cosyValidator.sprintf("Please enter a value between %s and %s characters long."),
		min : $.cosyValidator.sprintf("Please enter a value greater than or equal to %s."),
		max : $.cosyValidator.sprintf("Please enter a value less than or equal to %s."),
		range : $.cosyValidator.sprintf("Please enter a value between %s and %s."),
		equalTo : "Please enter the same value again."
		*/
	};
	
	$.cosyValidator.methods = {
		required : function(value, element){
			if (element.nodeName.toLowerCase() === "select"){
				var val = $(element).val();
				return val && val.length > 0;
			}
			
			if ($.cosyValidator.elementIsCheckable(element)){
				return $.cosyValidator.elementGetLength(element) > 0;
			}
			
			return $.trim(value).length > 0;
		},
		email : function(value, element){
			//return /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(value);
			return /^(.+)@(.+)\.(.+)$/.test(value);
		},
		url : function(value, element){
			return /^(https?|s?ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(value);
		},
		date : function(value, element){
			return !/Invalid|NaN/.test(new Date(value).toString());
		},
		dateISO : function(value, element){
			return /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/.test(value);
		},
		number : function(value, element){
			return /^-?(?:\d+|\d{1,3}(?:,\d{3})+)?(?:\.\d+)?$/.test(value);
		},
		digits : function(value, element){
			return /^\d+$/.test(value);
		},
		minlength : function(value, element, param){
			var length = $.isArray(value) ? value.length : this.elementGetLength(element);
			return length >= param;
		},
		maxlength : function(value, element, param){
			var length = $.isArray(value) ? value.length : this.elementGetLength(element);
			return length <= param;
		},
		rangelength : function(value, element, param){
			var length = $.isArray(value) ? value.length : this.elementGetLength(element);
			return (length >= param[0] && length <= param[1]);
		},
		min : function(value, element, param){
			return value >= param;
		},
		max : function(value, element, param){
			return value <= param;
		},
		range : function(value, element, param){
			return (value >= param[0] && value <= param[1]);
		},
		equalTo : function(value, element, param){
			var target = $(param);
			if (this.settings.onfocusout){
				target.unbind(".validate-equalTo").bind("blur.validate-equalTo", function(){
					$(element).valid();
				});
			}
			return value === target.val();
		}
	};
	
	// Add jQuery instance methods
	$.fn.extend({
		cosyValidator : function(options){
			return this.each(function(){
				$.cosyValidator.init(this, options);
			});
		}
	});
})(jQuery);