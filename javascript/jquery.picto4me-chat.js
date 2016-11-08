(function($) {
	// -----------------------------------
	var _entry=null;	
	var _entryPos=0;	
	var _currentPos=0;
	var _timer=null;
	var _increment = 200;
	var _onplayendcallback=null;
	var _onplaystartcallback=null;
	var _pictoscache={};
	var _msgnode = null;
	var _isrunning = false;
	var _initialpath = '';
	var _colors = null;
	var _audiocounter = 0;
	var _panelFooterHeight=40;
	
	window.p4m_chat = {
		enabled:false,
		text: null,
		audio: null,
		image: null,
		init:function(){
	        $('#_btn_switch_view').click(function(){
	        	window.p4m_chat.enabled=false;
	            var $btn=$(this);
	            $('div.im_dialogs_col_wrap').show();
	            $('div.im_history_col_wrap').hide();
	            $btn.hide();            
	        });
		},
		onContactSelected:function($scope){
			this.enabled=true;
			$('div.im_dialogs_col_wrap').hide();
            $('div.im_history_col_wrap').show();
            $('div.left-panel>div.yscrollable').scrollTop($('div.im_history_wrap').height());
            $('#_btn_switch_view').show();            
		},
		onSendMessage:function($scope){
		    if (this.text){
                if (angular.isString(this.text) && this.text.length > 0){
                    $scope.draftMessage.text=this.text;
                }
                this.text=null;
            }       
            if (this.image){
                $scope.draftMessage.files=[this.image];
                $scope.draftMessage.isMedia=true;
                this.image=null;
            }
            else
            if (this.audio){
                $scope.draftMessage.files=[this.audio];
                $scope.draftMessage.isMedia=true;
                this.audio=null;
            }
		},
		onMessageSent:function($scope){
            setTimeout(function(){
            	$('div.left-panel>div.yscrollable').scrollTop($('div.im_history_wrap').height());
            },500);
		},
		onIdle:function($scope){
			var div_i=$('div.im_history_wrap')[0];
        	var div_o=$('div.left-panel>div.yscrollable')[0];
  			div_o.scrollTop = div_i.scrollHeight;
		},
		sendMessage:function(entry, msg){
		    if ((!('chat' in entry)) || (!this.enabled) || (!(msg))){
                return;
            }   
            this.text=null;
            this.audio=null;
            this.image=null;
            var targetNode = document.getElementsByClassName('im_submit')[0];
            var sending=false;
            if (msg.sound_url  && entry.chat.sound){
            	if (msg.text && entry.chat.text){
                    this.text=msg.text;
                }
                var oReq = new XMLHttpRequest();
                oReq.open("GET", msg.sound_url, true);
                oReq.responseType = "arraybuffer";
                oReq.onload = function(oEvent) {
                  window.p4m_chat.audio=new Blob([oReq.response], {type: "audio/mp3"}); // "this" is not valid in context
                  setTimeout(function(){
                    _triggerMouseEvent(document.getElementsByClassName('im_submit')[0], "mousedown");
                  },0);
                };
                oReq.send();
                sending=true;
            }                               
            
            if (msg.image_url  && entry.chat.image){
            	if (msg.text && entry.chat.text){
                    this.text=msg.text;
                }
            	$.ajax({
                      dataType: "json",
                      url: '/api/itoj?ashtml=false&url='+msg.image_url,          
                      success: function(obj){
                            var b64image=obj.data;
                            window.p4m_chat.image=_b64toBlob(obj.data, "image/png");// "this" is not valid in context
                            setTimeout(function(){
                                _triggerMouseEvent(document.getElementsByClassName('im_submit')[0], "mousedown");
                            },0);
                          return;
                      },
                      error: function(e){
                          
                      }     
                });
                sending=true;
            }
            
            if ((!sending) && (msg.text && entry.chat.text) ){
            	this.text=msg.text;
            	setTimeout(function(){
                    _triggerMouseEvent(document.getElementsByClassName('im_submit')[0], "mousedown");
                },0);
            }            
		}
	};
	window.p4m_chat.init();

	// send a picto message
	var _sendPictoMessage=function(entry,picto){
        if (_isPictoLinked(picto) || (!('chat' in entry)) || (!window.p4m_chat.enabled) || (!(entry.chat.text||entry.chat.sound||entry.chat.image))){
            return;
        }   
        var sound_url=picto.dom_id ? $('#'+picto.dom_id).attr('src') : '';
        var text=(picto.description && picto.description.text) || (picto.title && picto.title.text)||'';
        var msg={
            text: (picto.description && picto.description.text) || (picto.title && picto.title.text)||'',
            sound_url: picto.dom_id ? $('#'+picto.dom_id).attr('src') : '',
            image_url: picto.imageurl
        };
        window.p4m_chat.sendMessage(entry,msg);
	};
	
	/* Translation Functions */
	var _msg=function(msg){
		if (Picto4Me && Picto4Me.MSG && Picto4Me.MSG[msg.toLowerCase()]){
			return Picto4Me.MSG[msg.toLowerCase()];	
		}
		return msg;
	};
	
	var _msgspan=function(msg){
		return $('<span></span>').html(_msg(msg)).text();	
	};
	
	var _b64toBlob=function(b64Data, contentType, sliceSize) {
		  contentType = contentType || '';
		  sliceSize = sliceSize || 512;
		  var byteCharacters = atob(b64Data);
		  var byteArrays = [];
		  for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
		    var slice = byteCharacters.slice(offset, offset + sliceSize);
		    var byteNumbers = new Array(slice.length);
		    for (var i = 0; i < slice.length; i++) {
		      byteNumbers[i] = slice.charCodeAt(i);
		    }
		    var byteArray = new Uint8Array(byteNumbers);
		    byteArrays.push(byteArray);
		  }
		  var blob = new Blob(byteArrays, {type: contentType});
		  return blob;
	};
    //--- Simulate a natural mouse-click sequence.
    //triggerMouseEvent (targetNode, "mouseover");
	//triggerMouseEvent(targetNode, "mousedown");
    //triggerMouseEvent (targetNode, "mouseup");
    //triggerMouseEvent (targetNode, "click");

	function _triggerMouseEvent (node, eventType) {
	    if (node){
		    var clickEvent = document.createEvent ('MouseEvents');
		    clickEvent.initEvent(eventType, true, true);
		    node.dispatchEvent(clickEvent);
	    }
	}
	
	// Translate
	var _translate=function(locale){
		if (locale!='en'){
			$('.p4m_msg').each(function(){
				if ($(this).is('SPAN'))
					$(this).text(_msgspan($(this).text()));
				else if ($(this).is('DIV'))
					$(this).attr('title',_msg($(this).attr('title')));
			});				
		}
	};
	/* Translation Functions */
	
	/* Show Info Functions */
	var _setStatus = function(el,cls){
		if (cls=='down')
			$('td.highlighted').css('background-color','yellow');
		else if (cls=='up')
			$('td.highlighted').css('background-color','transparent');
		else if (cls=='timeout')
			$('td.highlighted').css('background-color','gray');
	};
	
	/* 
	 * returns from a url parameter with name
	 */
	var _gup=function(name,url){
		var self = this;
		var href = url || window.location.href;
		name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
		var regexS = "[\\?&]"+name+"=([^&#]*)";
		var regex = new RegExp( regexS );
		var results = regex.exec(href);
		if( results === null)
			return null;
		else
			return results[1];
	};
	
	//------------Begin of _preLoadImages-----------------//
	var _preLoadMedia=function(entry){		
		if (entry && entry.sheets && entry.sheets.length>0){
			var soundSource=_soundSource();
			for(var s in entry.sheets){
				var sheet=entry.sheets[s];
				if (sheet){
					if (sheet.type!='plugin'){
						if (sheet.pictos && sheet.pictos.length>0){
							for(var p in sheet.pictos){
								var picto = sheet.pictos[p];
								if (picto){								
									if (picto.imageurl && picto.imageurl.length>0){												
										$('div.preloader').append('<img src="'+picto.imageurl+'" />');
									}
									if (soundSource!='server'){
										if (picto.soundurl && picto.soundurl.length>0){													
											_audiocounter+=1;
											var audid='_p4msnd'+_audiocounter;
											var auduri=picto.soundurl;
											if (auduri.indexOf('/api/tts')>=0){
												auduri=auduri+'&fmt=mp3';// tts&fmt=mp3
								    		}
											picto['dom_id']=audid;
											$('div.preloader').append('<audio id="'+audid+'" src="'+auduri+'" data-canplay="0"></audio>');
											var elSound = $('#'+audid).get(0);											
									 	    if (elSound){
									 	    	_loadSoundFile(elSound);
									 	    }
										}										
									}
								}								
							}							
						}
					}
				}
			}
		}
	};
	//------------End of load image process ---------//
	
	/* begin _loadSoundFile*/
	var _loadSoundFile=function(elSound, callback){
		var canplay_handle = function(evt){			
			$(this).attr('data-canplay','1');
 	 		if (callback && typeof(callback)=='function'){
 	 			callback(true);
 	 		}
 	 		this.removeEventListener('canplay',arguments.callee,false);
		};
		elSound.removeEventListener('canplay',canplay_handle);
    	elSound.addEventListener('canplay', canplay_handle);					 	 	 	
    	try{
    		var tries = parseInt($(elSound).attr('data-canplay'))-1; 
    		$(elSound).attr('data-canplay',tries);
    		elSound.load();
    		// Check if it was not possible to load
    		setTimeout(function(){
    			var ntries=parseInt($(elSound).attr('data-canplay'));
    			if (ntries<0){
    				// It tried already twice, so will not try again
 	    			if (callback && typeof(callback)=='function'){
 	    				callback(false);
	 	 	 		}
 	    		}
    		},2000);
    	}
    	catch(err){
    		console.log("Audio error");
    		if (callback && typeof(callback)=='function'){
 				callback(false);
 	 		}
    	}
	};
	/* end _loadSoundFile*/
	
	/* begin _onPlaySound*/
	var _onPlaySound=function(entry, pictopos, oncallback){
        if (!entry || entry.activesheet<0) return;
        var _cb=oncallback||function(d){return false;};
        _onplayendcallback=null;
        var sheet = entry.sheets[entry.activesheet];
        if ((!sheet) || (!sheet.pictos) || (sheet.pictos.length<0) || (pictopos<0) || (pictopos>sheet.pictos.length-1)) return;
        var picto = sheet.pictos[pictopos];
        if (picto && picto.dom_id && picto.dom_id.length>0){    
            
            var _endhandler=function(evt) {
                $('#'+picto.id).parent().find('div.pictosound').removeClass('spinner');
                $('#'+picto.id).parent().find('div.pictolink').css('background-color','transparent');
                this.removeEventListener('ended',arguments.callee,false);
                _cb(picto); 
                return;
            };
            
            var elSound = $('#'+picto.dom_id).get(0);
            if (elSound){
                var canplay = $(elSound).attr("data-canplay");
                if (canplay && canplay.length>0){
                    if (parseInt(canplay)==1){
                        elSound.removeEventListener('ended',_endhandler);
                        elSound.addEventListener('ended', _endhandler);
                        $('#'+picto.id).parent().find('div.pictosound').addClass('spinner');
                        if (picto.link!==undefined && picto.link!==null){
                            $('#'+picto.id).parent().find('div.pictolink').css('opacity','1').hide().fadeIn();
                        }
                        elSound.play();
                        return;
                    }
                    else{
                        var ntries = parseInt($(elSound).attr('data-canplay'));
                        if (ntries<=-2){
                            _cb(picto);
                        }
                        else{
                            _loadSoundFile(elSound,function(canplay){
                                if (canplay) elSound.play();
                                _cb(picto);                         
                            });                     
                        }
                        return;
                    }
                }
            }
        }   
        _cb(picto);         
    };
	/* end */
	
	var _soundSource=function(){		
		if ((navigator.appVersion.toUpperCase().search("MIDORI")>=0)||
			(navigator.appVersion.toUpperCase().search("ARMV6L")>=0)){
			return 'server';
		}
		return 'browser';
	};
	
	//--------------------------------------
	var _speedChanged=function(milsec){
		var maxspeed=5000;
		var delta = ((maxspeed-milsec+100)/maxspeed)*10;
		var vlr=parseFloat(Math.round(delta * 10) / 10).toFixed(1);
		$('.speed').text(vlr);
	};

	var _pushState=function(entry){
//		if (entry && entry.sheets && entry.sheets[entry.activesheet]){
//			var title = entry.sheets[entry.activesheet].title.text||"Undefined";
//			window.history.pushState({rid:entry.key, activesheet:entry.activesheet, title:title}, "Picto4Me - "+title, _initialpath+'/'+entry.key+'/'+entry.activesheet);			
//		}
//		else{
//			window.history.pushState({fool: '/'}, "Picto4Me - Player", _initialpath);
//		}
	};
	
	// ------------------------------------
	var _extendBoard=function(jsonContent){
		var tpl=$.extend(true,{},Picto4Me.boardDefaults);
		if (jsonContent && jsonContent.sheets && jsonContent.sheets.length>0){
		  for(var xs in jsonContent.sheets){
			  var sheet=jsonContent.sheets[xs];
			  tpl.sheets.push( $.extend(true,{},Picto4Me.sheetDefaults) );
			  if (sheet && sheet.pictos && sheet.pictos.length>0){											  
				  for(var xp in sheet.pictos){
					  tpl.sheets[xs].pictos.push($.extend(true,{},Picto4Me.pictoDefaults));												  
				  }
			  }
		  }
		}
		return $.extend(true,tpl,jsonContent);
	};
		
	// BEGIN onCellClicked
	// possible only if it is not playing
	var _onCellClicked=function($this,elTd){
		if (_isrunning) return;
		var imgContainer=elTd.children('div.imgcontainer');
		if (!imgContainer)
			return;
		var img=imgContainer.children('img.picto');
		if (img){
			var entry = $this.data('entry');
			if (!entry || (!entry.sheets) || (entry.sheets.length===0))
				return;			
			var sheet = entry.sheets[entry.activesheet];
			if (sheet){
				var id = img.attr('id');
                var _executePicto=function(entry,i,picto){
                    if (_onPlaySound(entry,i,function(picto){
                        _onUnselect(imgContainer); 
                        _onOpenSheet($this,entry,picto);
                    }));
                };
                for(var i in sheet.pictos){
                    var picto=sheet.pictos[i];
                    if (picto && picto.id && picto.id==id){
                        _executePicto(entry,i,picto);
                        _sendPictoMessage(entry,picto);
                        break;
                    }
                }
			}			
		}
	};
	
	var _onCellEnter=function($this,elTd){
		if (_isrunning) return;
		var imgContainer=elTd.children('div.imgcontainer');
		if (!imgContainer)
			return;
		var img=imgContainer.children('img.picto');
		if (img){
			var entry = $this.data('entry');
			if (!entry || (!entry.sheets) || (entry.sheets.length==0))
				return;			
			var sheet = entry.sheets[entry.activesheet];
			if (sheet){
				var id = img.attr('id');
				for(var i in sheet.pictos){
					if (sheet.pictos[i] && sheet.pictos[i]['id'] && sheet.pictos[i]['id']==id){						
						_onSelect($this,sheet, sheet.pictos[i], imgContainer);
						break;
					}
				}
			}			
		}
	};
	
	var _onCellLeave=function($this,elTd){
		if (_isrunning) return;
		var imgContainer=elTd.children('div.imgcontainer');
		if (!imgContainer)
			return;
		var img=imgContainer.children('img.picto');
		if (img){
			var entry = $this.data('entry');
			if (!entry || (!entry.sheets) || (entry.sheets.length==0))
				return;			
			var sheet = entry.sheets[entry.activesheet];
			if (sheet){
				var id = img.attr('id');
				for(var i in sheet.pictos){
					if (sheet.pictos[i] && sheet.pictos[i]['id'] && sheet.pictos[i]['id']==id){
						_onUnselect(imgContainer);
						break;
					}
				}
			}			
		}
	}
	
	var _onSelect=function($this, sheet, picto, imgContainer){
		if (_isrunning){
			if (sheet.pictoColorBackgroud){
				var outline = _colors.compare(sheet.pictoOverrule.borderColor,picto.bgColor)?'#d0d0d0':sheet.pictoOverrule.borderColor;
				if (_colors.compare(picto.bgColor,'#FFFFFF') || (picto.bgColor=='transparent')){
					_colors.set(_colors.set(imgContainer,'background','transparent').parent(),'outline',outline).addClass('highlighted').removeClass('opaque');
				}
				else{
					_colors.set(_colors.set(imgContainer,'background',picto.bgColor).parent(),'outline',outline).addClass('highlighted').removeClass('opaque');
				}
			}
			else{
				if (_colors.compare(picto.bgColor,'#FFFFFF') || (picto.bgColor=='transparent')){
					var outline = _colors.compare(sheet.pictoOverrule.borderColor,picto.bgColor)?'#d0d0d0':sheet.pictoOverrule.borderColor;
					_colors.set(_colors.set(imgContainer,'background','transparent').parent(),'outline',outline).addClass('highlighted').removeClass('opaque');
				}
				else{
					var outline = (_colors.compare(picto.bgColor,'#FFFFFF') || (picto.bgColor=='transparent'))?'#d0d0d0':picto.bgColor;
					_colors.set(_colors.set(imgContainer,'background','transparent').parent(),'outline',outline).addClass('highlighted').removeClass('opaque');
				}				
			}			
			if (imgContainer.offset().top+imgContainer.height()>window.innerHeight){
				window.scrollTo(0,imgContainer.offset().top);
			}
			else{
				if (window.scrollY>imgContainer.offset().top){
					window.scrollTo(0,imgContainer.offset().top);
				}
			}
		}
	};
	
	var _onUnselect=function(imgContainer){		
		if (_isrunning){
			_colors.reset(_colors.reset(imgContainer).parent()).removeClass('highlighted').addClass('opaque');
		}				
	};
	
	var _isPictoLinked=function(picto){
	   return (picto && picto.link!==undefined && picto.link!==null);
	};
	
	var _onOpenSheet=function($this,entry, picto){
		if (_isPictoLinked(picto)){
			var i = parseInt(picto.link);
			if (i>=0 && entry.sheets.length>0 && i<entry.sheets.length){
				_setActiveSheet($this, i);
				return true;
			}
		}
		return false;
	};

	var _playActionOnPictoAt=function($this, i, action, callback){
		var _cb=callback||function(d){};
		var elTD=$('div.margins > table > tbody > tr > td:eq('+i+')');
		if (!elTD || elTD.length===0){
           _cb(null);
            return;
        }
		if ($this && (!$this.data)){
			console.log('err');
		}
		var entry = $this.data('entry');
		if (!entry){
            _cb(null);
            return;
        }
		var sheet = entry.sheets[entry.activesheet];
		var picto = sheet.pictos[i];
		if (!picto){
		    _cb(null);
		    return;
		}
		var imgContainter=elTD.children('div.imgcontainer');
		var elPictoTitle = elTD.find('div.pictotitle');
		var borderWidth = parseInt(elTD.css('outline-width').replace(/px/ig,''));
		var bgColor = picto.bgColor;
		if (action=='select'){			
			_onSelect($this,sheet,picto,imgContainter);			
		}
		else if (action=='unselect'){
			_onUnselect(imgContainter);			
		}
		else if (action=='go'){
			_onPlaySound(entry, i, function(){
				_onUnselect(imgContainter);			
				_onOpenSheet($this,entry,picto);
				_sendPictoMessage(entry,picto);
				_cb(picto);		
			});
		}
	};
	
    // BEGIN  of _updPictoSize
    var _updPictoSize=function(sheet, picto, $img)
    {
        var pictosize = -1;     
        if (picto.size>0){
            pictosize=picto.size;                           
        }
        else{
            pictosize=sheet.pictoSize;
            picto.size=null;
        }   
        if (pictosize>0){
            $img.css({'width':(pictosize+"%"),'margin':((100-pictosize)/2+"%")});   
        }       
    };
    // END of _updPictoSize 

	//------------Begin set active sheet -----------------// 
	var _setActiveSheet=function($this, i, back){
		var entry = $this.data('entry');
		if (!entry || (!entry.sheets) || (entry.sheets.length===0) || (i<0) || (i>=entry.sheets.length) )
			return null;
		var sheet=null;
		if (entry.activesheet==i){
			sheet = entry.sheets[entry.activesheet];
			_currentPos=sheet['firstpicto'];
			_updPictos(sheet);
		}
		else{
			entry.activesheet=i;
			sheet = entry.sheets[entry.activesheet];
			if (sheet && (!sheet['lastpicto'])){
				sheet['firstpicto']=-1;
				sheet['lastpicto']=-1;
				var ncells = sheet.columns*sheet.rows;
				var nloop = (sheet.pictos.length>ncells)?ncells:sheet.pictos.length; // the configured board might be smaller than number of pictos on it
				for(var c=0;c<nloop;c++){
					if (sheet.pictos[c]){
						if (sheet['firstpicto']==-1) sheet['firstpicto']=c;
						sheet['lastpicto']=c;
					}
				}
			}
			_currentPos=sheet['firstpicto'];			
			_updSheetDataView($this);
			if (!back && entry.id){
				_pushState(entry);
			}
		}
		if (entry.activesheet==entry['initialsheet']){
			var boards = $this.data('boards');
			if (boards && boards.length==1){
				$('.switch2').hide();			
			}
			else{
				$('.switch2').show();
			}
		}
		else{
			$('.switch2').show();
		}
		return entry;
	};
	//------------END set active sheet -----------------//
	
	//------------BEGIN _updatePanelHeight -----------------//
	var _updatePanelHeight=function(){
        var sheet=_getActiveSheet();
        var h=_getAvailableHeight(sheet);
        $('div.top-panel').css('height',h+'px');
        $('div.plugin').css('height',h+'px');
        $('div.bottom-panel').css('height',_panelFooterHeight+'px');
    };
	//------------BEGIN _updatePanelHeight -----------------//
	
    //------------BEGIN _getTableWidth -----------------//
    var _getAvailableHeight=function(sheet){
    	return parseInt((window.innerHeight-_panelFooterHeight-5));
    };
    //------------END _getTableWidth -----------------//
	
	//------------BEGIN _getTableWidth -----------------//
	var _getTableWidth=function(sheet){
		var availHeight = _getAvailableHeight(sheet);
		var borderWidth=2*sheet.columns;
		var tableWidth = (availHeight-borderWidth) * (sheet.columns/sheet.rows); 
		if (tableWidth>((window.innerWidth*0.8)*0.9)){ //80% right panel - 10% margin (it could be .too  
        	tableWidth=(window.innerWidth*0.8)*0.9;
        }
		return parseInt(tableWidth,10);
	};
	//------------END _getTableWidth -----------------//
	
	//------------BEGIN _getTableWidth -----------------//
	var _getActiveSheet=function($this){
	    var _$this = $this || $('div.paper');
		var entry = _$this.data('entry');
		if (!entry || (!entry.sheets) || (entry.sheets.length<=0))
			return null;
		var sheet = entry.sheets[entry.activesheet];
		if (!sheet) 
			return null;
		return sheet;
	};
	//------------END _getTableWidth -----------------//
	var _updSheetDataView=function($this){
		var sheet = _getActiveSheet($this);
		if (!sheet) return;
		sheet.title.visible=false;
		if (!sheet.html || sheet.html===""){
			var html = '<div class="margins" style="display:none;">';
			if (sheet.type=='plugin'){
				html+='<div class="plugin"></div>';
			}
			else{
				window.scrollTo(0,0);
				if (window.fullScreenApi.isFullScreen()){
					window.fullScreenApi.requestFullScreen($this[0],function(){});
				}
				var titleText   = $.trim(sheet.title.text);
				var visibility  = (sheet.title.visible)?'block':'none';
				var tableWidth  = _getTableWidth(sheet); 
				html+='<div class="sheettitle" style="display:'+visibility+'">'+titleText+'</div>';
				html+='<table border="0" class="sheet" style="width:'+tableWidth+'px;"><tbody>';
				//html+='<table border="0" class="sheet"><tbody>';
				var i=-1;
				for(var r=0;r<sheet.rows;r++){
					html+='<tr align="center" valign="middle">';
					for(var c=0;c<sheet.columns;c++){
						var id = '_td'+(++i);
						var imgcontainer='<div class="imgcontainer"></div>';
						html+='<td class="cell" id="'+id+'"><div class="pictotitle pictotitle-'+sheet.cellsize+'"></div>'+imgcontainer+'</td>';
					}
					html+='</tr>';
				}
				html+='</tbody></table>';
			}
			html+='</margins>';
			$this.html(html);	
		}
		else{
			$this.html(sheet.html);	
			$('div.margins').fadeIn('fast',function(){
				if (sheet.type=='sheet'){
					if (_isrunning){
						_updPictos(sheet);
					}
					_listenMouseEvents($this);				
				}
			});
			return;							
		}
		//--------------------------------------
		if (sheet.type=='sheet'){
			$('td.cell').css('outline-width',sheet.pictoBorder+'px').css('outline-offset',-1*(sheet.pictoBorder+1)+'px');
			_updPictos(sheet,'image');
			_colors.reset($('div.imgcontainer:empty').parent());
			$('div.imgcontainer:empty').parent().parent().each(function(i,o){
				var cells=$(o).children('td');
				var ncells=cells.length;
				var noimage=cells.children('div.imgcontainer:empty').length;
				if (ncells==noimage)
					$(this).hide();
			});
			$('div.margins>table>tbody>tr>td.opaque').removeClass('highlighted');
			sheet.html=$this.html();// store it so no need to rebuild	
			$('div.margins').fadeIn('fast',function(){
				_updPictos(sheet,'title');						
				_listenMouseEvents($this);
			});
		}
		else if (sheet.type=='plugin'&&($.trim(sheet.title.text).length>0)){
			var pluginname=$.trim(sheet.title.text);
			if (pluginname in $.fn){
				var shadow=10;
				//var boardsize = $this.children('div.margins').children('table').width();
				var win_w = parseInt(window.innerWidth  * .90);
				var win_h = parseInt(window.innerHeight * .99);
				var $plugin = $('div.plugin');
				var entry = $this.data('entry');
				if (!entry || (!entry['sheets']) || (entry.sheets.length<=0))
					return;
				sheet.plugin=$plugin[pluginname]({
					as_plugin:true, 
					uid:(entry.uid||null),
					locale:(entry.locale||Picto4Me.locale),
					gender:(entry.gender||'female'),
					timer: _timer,
					onplay: function(data){
						if (data && data.text){
							var msg={
					            text: data.text,
					            sound_url: data.sound_url||'',
					            image_url: ''
					        }
					        window.p4m_chat.sendMessage(entry,msg);
						}
					}
				});
				if (sheet.plugindata){
					sheet.plugin[pluginname]('entries',sheet.plugindata);
				}
				_updatePanelHeight();
				$('div.margins').fadeIn(function(){
					sheet.plugin[pluginname]('show');
					if (_timer && _timer.enabled){
						sheet.plugin[pluginname]('play');													
					}
					return;
				});	
			}
		}
	};
	
	var _updPictos=function(sheet,what){
		//what = 'image' || 'title' || 'both'
		var _what = what || 'both';
		var i=-1;
		for(var r=0;r<sheet.rows;r++){
			for(var c=0;c<sheet.columns;c++){
				var picto = sheet.pictos[++i];
				if (picto){						
					sheet.pictos[i]=picto;			
					if (picto && (!picto.id)){
						picto.id = '_i'+(++sheet.lastId)+'_';
					}						
					if ((_what ==='both')||(_what ==='image'))					
						_updPictoImageAt(sheet,picto,i);
					if ((_what ==='both')||(_what ==='title'))
						_updPictoTitleAt(sheet,picto,i);
				}							
			}
		}
		if ((_what ==='both')||(_what ==='image')){
			var tableWidth=_getTableWidth(sheet);
			var imageWidth=tableWidth/sheet.columns;
			var perc=parseInt(imageWidth/tableWidth*100,10);
			$('td.cell').css({'width':perc+'%','height':perc+'%'});			
		}
	};
	
	var _updPictoImageAt=function(sheet,picto,i){
		var tdNode=document.getElementById('_td'+i);
		if(!tdNode || tdNode.childNodes.length<2) return;
		var imgContainerNode = tdNode.childNodes[1];
		if (!imgContainerNode) return;
		if (picto){
			if (picto.id){
				if (!document.getElementById(picto.id)){				
					var src = null;
					src = picto.imageurl;					
					if (src){
						var html = '';	
						if (picto.soundurl){							
							html+='<div class="icon21 icon21-64 pictosound pictoicon"></div>';
						}
						if (picto.link!==undefined && picto.link!==null){							
							html+='<div class="icon21 icon21-35 pictolink pictoicon"></div>';
						}
						html+='<img id="'+picto.id+'" src="'+src+'" class="picto" />';						
						imgContainerNode.innerHTML=html;
                        var $img = $('#'+picto.id);
                        if ($img && $img.length==1){                            
                            _updPictoSize(sheet, picto, $img);
                        } 
					}
				}
			}
			if (_isrunning){
				if (_currentPos==i){
					if (sheet.pictoColorBackgroud){
						if (_colors.compare(picto.bgColor,'#FFF')||_colors.compare(picto.bgColor,'transparent')){
							_colors.set(_colors.set(imgContainerNode,'background','transparent').parent(),'outline',sheet.pictoOverrule.borderColor);
						}
						else{
							_colors.set(_colors.set(_colors.set(imgContainerNode,'background',picto.bgColor).parent(),'background',picto.bgColor),'outline',sheet.pictoOverrule.borderColor);
						}
					}
					else{
						if (_colors.compare(picto.bgColor,'#FFF')||_colors.compare(picto.bgColor,'transparent')){
							_colors.set(_colors.set(imgContainerNode,'background','transparent').parent(),'outline',sheet.pictoOverrule.borderColor);
						}
						else{							
							_colors.set(_colors.set(imgContainerNode,'background','transparent').parent(),'outline',picto.bgColor);
						}				
					}
					$(imgContainerNode).parent().addClass('highlighted');	
				}
				else{
					//$(imgContainerNode).parent().removeClass('highlighted').addClass('opaque');
					_colors.reset(_colors.reset($(imgContainerNode)).parent()).removeClass('highlighted').addClass('opaque');
				}
			}
			else{
				if (sheet.pictoColorBackgroud){
					if (_colors.compare(picto.bgColor,'#FFF')||_colors.compare(picto.bgColor,'transparent')){
						_colors.set(_colors.set(imgContainerNode,'background','transparent').parent(),'outline',sheet.pictoOverrule.borderColor);
					}
					else{
						_colors.set(_colors.set(_colors.set(imgContainerNode,'background',picto.bgColor).parent(),'background',picto.bgColor),'outline',sheet.pictoOverrule.borderColor);
					}
				}
				else{
					if (_colors.compare(picto.bgColor,'#FFF')||_colors.compare(picto.bgColor,'transparent')){
						_colors.set(_colors.set(imgContainerNode,'background','transparent').parent(),'outline',sheet.pictoOverrule.borderColor);
					}
					else{						
						_colors.set(_colors.set(imgContainerNode,'background','transparent').parent(),'outline',picto.bgColor);
					}				
				}
				$(imgContainerNode).parent().removeClass('highlighted').removeClass('opaque');
			}		
		}
		else{
			_colors.set(_colors.set(imgContainerNode,'background','transparent').html('').parent(),'outline','transparent');
		}
	};	
	
	var _updPictoTitleAt=function(sheet,picto,i){
		var tdNode=document.getElementById('_td'+i);
		if(!tdNode || tdNode.childNodes.length<2) return;
		var pictoTitleNode = tdNode.childNodes[0];
		if (!pictoTitleNode) return;		
		if (picto){
			if (picto.title.text && $.trim(picto.title.text)!==''){
				var borderWidth = parseInt('0'+tdNode.style.outlineWidth.replace(/px/ig,''));	
				// Horizontal
				if(picto.title.horAlign=='left'){				
					pictoTitleNode.style.textAlign='left';
					pictoTitleNode.style.left=borderWidth+2;
					pictoTitleNode.style.right='auto';
				}
				else if(picto.title.horAlign=='right'){				
					pictoTitleNode.style.textAlign='right';
					pictoTitleNode.style.right=borderWidth+2;
					pictoTitleNode.style.left='auto';
				}
				else if(picto.title.horAlign=='center'){				
					pictoTitleNode.style.textAlign='center';
					pictoTitleNode.style.left='auto';
					pictoTitleNode.style.right='auto';
				}
				// Vertical					
                if(picto.title.verAlign=='top'){
                    pictoTitleNode.style.top='0';
                    pictoTitleNode.style.marginTop=((borderWidth+2)+'px');
                }
                else if(picto.title.verAlign=='middle'){
                    pictoTitleNode.style.top='50%'; 
                    pictoTitleNode.style.marginTop='-0.5em';
                }
                else if(picto.title.verAlign=='bottom'){
                    // formula: (2 * max border size) - (maxbordersize-current border size)
                    var f = (2*20)-(20-borderWidth);
                    pictoTitleNode.style.top='100%'; 
                    pictoTitleNode.style.marginTop='-'+(f+'px');
                }
                pictoTitleNode.innerText=picto.title.text;
			}
		}
		else{
			pictoTitleNode.innerText="";
		}
	};	
	
		
	//------------Begin of _setBoard-----------------//	
	var _setBoard=function($this,i){
		var boards = $this.data('boards');
		if (boards && boards.length>0 && i<boards.length && i>=0){
			var entry=_extendBoard(boards[i].board);
			if (entry){
				$this.data('entry',entry);
				_preLoadMedia(entry);
				$('div.im_dialogs_col_wrap').show();
	            $('div.im_history_col_wrap').hide();
	            $('button.chattext>div').css('opacity',entry.chat.text   ? '1' :'0.3');
	            $('button.chatimage>div').css('opacity',entry.chat.image ? '1' :'0.3');
	            $('button.chatsound>div').css('opacity',entry.chat.sound ? '1' :'0.3');
                entry.initialsheet=entry.activesheet;
                entry.activesheet=-1;
                _setActiveSheet($this,entry.initialsheet);
                _updatePanelHeight();
                $this.show();
                _speedChanged(_timer.interval); 			
			}
		}			
		return $this;
	};
	//------------End of load image process ---------//
	
	// --------------Begin Setup FullScreenIndex-----------------//
	var _setupFullScreenMode=function($this){
		if (window.fullScreenApi.supportsFullScreen) {
			var fullModeHandler=function(){
				if (fullScreenApi.isFullScreen()) {
					
				} 
				else {
					
				}
			};
            //var target=$this.get(0);//paper
            var target = document.body; 
            target.addEventListener(fullScreenApi.fullScreenEventName, fullModeHandler, true);
            $('.fullscreen').click(function(){
                window.fullScreenApi.requestFullScreen(target);
            });
		}

		// handle window resize
		$(window).resize(function() {
		    var sheet=_getActiveSheet($this);
		    if (sheet){
		    	var tableWidth=_getTableWidth(sheet);
		    	var $table=$this.find('div.margins>table');
		    	if ($table.length>0){
		    		$table.css('width',tableWidth+'px');
		    		_updPictos(sheet,'title');
		    		//_updPictos(sheet);
		    	}
		    	_updatePanelHeight();
		    }
		});		
        
	};
	// End Setup FullScreenIndex-----------------//
	
	var _bodyKeyDown=function($this,el,ev){
		if ($this._keydown) 
			return true;
		if ((ev.which==32)||(ev.which==39)){					
			$this._keydown=true;
			$this._keydowntimeout=-1;
			$this._keydowntimer=setTimeout(						
				function(){
					if ($this._keydowntimer && $this._keydown && $this._keydowntimeout==-1){
						$this._keydowntimeout=1;									
						$this.boardplayer('ontimeout',ev.which);
					}								
				},
				2000
			);
			ev.stopPropagation();
			ev.preventDefault();
 		    return false;
	    }
	    return true;
	};
	
	var _bodyKeyUp=function($this,el,ev){
		clearTimeout($this._keydowntimer);
		$this._keydowntimer=null;
		$this._keydown=false;
		var timeoutstatus = $this._keydowntimeout;
		$this._keydowntimeout=0;
		if ((ev.which==32)||(ev.which==39)){				    	
	    	if (timeoutstatus==1){
	    		$this.boardplayer('stop');					    							    		
	    	}
	    	else if (timeoutstatus==-1){
	    		if (_timer){
	    			if (_timer.enabled){					    				
			    		$this.boardplayer('select');							    		
	    			}
	    			else{
	    				$this.boardplayer('play');							    		
	    			}
	    		}				    		
	    	}
	    	return false;
	    }
	    else if ((ev.which==8)||(ev.which==37)){
	    	var isplugin=false;
	    	var entry = $this.data('entry');
			if (entry){
				isplugin=entry.sheets[entry.activesheet].plugin;
			}
	    	if (isplugin){
	    		$this.boardplayer('onchar',ev.which);
	    	}
	    	else{
		    	//window.history.back();
	    		if (entry)
	    			_setActiveSheet($this,entry.initialsheet);
	    	}
			return false;
	    }
	    else if ((ev.which==107)||(ev.which==38)){				    	
    		$this.boardplayer('ispeed');
    		return false;					    							    	
	    }
	    else if ((ev.which==109)||(ev.which==40)){				
	    	$this.boardplayer('dspeed');	
	    	return false;			    						    	
	    }
	    else if ((ev.which==32)||(ev.which>=65&&ev.which<=90)||(ev.which>=97&&ev.which<=122)){
	    	$this.boardplayer('onchar',ev.which);
	    	return false;
	    }		
	    return true;
	};
	
	var _listenMouseEvents=function($this){
		$('td.cell').click(
			function(e){
				_onCellClicked($this,$(this));e.stopPropagation();e.preventDefault();return false;
			}
		).mouseenter(
			function(e){
				_onCellEnter($this,$(this));e.stopPropagation();e.preventDefault();return false;
			}
		).mouseleave(
			function(e){
				_onCellLeave($this,$(this));e.stopPropagation();e.preventDefault();return false;
			}
		);
	};
	
	var _listenKeyboardEvents=function($this){
		$('body').keydown(function(e) {
		    return _bodyKeyDown($this,this,e);
		}).keyup(function(e) {
			return _bodyKeyUp($this,this,e);
		});
	};
	
	//==========================================
	// begin Init 
	var _init=function($this,boards){
		$this._keydown=false; // 
		$this._keydowntimeout=0; // -1 pressed ; 0 released; 1 timedout;
		$this._keydowntimer=null;
		$this._keydowntimeout=0;
		$this._playpressed=false;
		$this._allowclick=true;
		if (!_timer){
			_timer=new Picto4Me.Timer();			
		}
		_colors = new Picto4Me.Colors();
		_colors.inject();		
		$this.data('boards',boards); // save the boards
		_translate(Picto4Me.locale||'en'); //Translate based on the local translation file
		//=================================================================
		_initialpath='/chat';
		//can not change the history because telegram will
		// replace the current controller (IM) to Welcome and then to IM again.
		
//		window.onpopstate = function(event) {
//			if (document.location.href.indexOf('#')>0) return;
//			if (document.location.pathname==_initialpath){
//				var check=$this.data('boards');
//				if (!check || check.length<2)
//					return;
//			}
//			else{
//				var entry = $this.data('entry');
//				if (entry){
//					var curpath = window.document.location.pathname.split('/');
//					var activesheet = parseInt(curpath[curpath.length-1]);
//					if (activesheet>=0 && entry.sheets.length>0 && activesheet<entry.sheets.length){
//						_setActiveSheet($this, activesheet, true);
//						if (_isrunning){
//							_colors.set($('div.imgcontainer'),'background','transparent').parent().removeClass('highlighted').addClass('opaque');
//							_playActionOnPictoAt($this,_currentPos,'select');
//							_timer.start();
//						}
//					}
//				}
//			}
//		};
		
		if (boards.length>0){
			_setBoard($this,0);
		}
		//===================================
		// JQuery Events
		$('body').mousedown(function(e){	
			if ($this.boardplayer('status')=='busy'){
				$this._playpressed=true;
				setTimeout(function(){
					if ($this._playpressed){
						$this.boardplayer('stop');
						$this._allowclick=false;
					}
				},2000);
				e.stopPropagation();
				e.preventDefault();
				return false;
			}
			else{
				$this._allowclick=true;
			}
			return true;
		});
		//switch1 = Button A
		$('.switch1').click(function(e){
			if ($this._keydowntimeout==0){						
				if ($this._allowclick){
					$this.boardplayer('play');
				}
			}
			$this._playpressed=false;
			$this._allowclick=true;
		});
		//switch2 = Button B
		$('.switch2').click(function(e){					
			//window.history.back();
			var entry=$this.data('entry');
			if (entry)
				_setActiveSheet($this,entry.initialsheet);
		});
		//switch3 = Button C
		$('.switch3').click(function(e){					
			$this.boardplayer('dspeed');
		});				
		//switch4 = Button D
		$('.switch4').click(function(e){					
			$this.boardplayer('ispeed');
		});
		
		$('.chattext').click(function(e){					
			$this.boardplayer('chattext');
		});
		
		$('.chatimage').click(function(e){					
			$this.boardplayer('chatimage');
		});
		
		$('.chatsound').click(function(e){					
			$this.boardplayer('chatsound');
		});
		
		$('div.messages').hide();
		$('div.controls').show();
		
		_listenKeyboardEvents($this);		
		_setupFullScreenMode($this);		
		//====================================================
		if (_timer){    				    				
			_timer.tick=function(){
				if ($this._keydown) return;
				var entry = $this.data('entry');
				if (entry){
					// Board
					var previous = _currentPos;				
					var sheet = entry.sheets[entry.activesheet];
					if (sheet.plugin){
						sheet.plugin[sheet.title.text]('ontimer');
						return;
					}
					while(true){
						_currentPos++;
						if (_currentPos>sheet['lastpicto']){
							_currentPos=sheet['firstpicto'];
							break;
						}
						else if (sheet.pictos[_currentPos]){
							break;
						}
					}
					if (previous!=_currentPos){
						_playActionOnPictoAt($this,previous,'unselect');						
					}
					_playActionOnPictoAt($this,_currentPos,'select');
				}
				else{
					// Index
					$('div.board,active').removeClass('active');
					_currentPos++;
					if (_currentPos>=$('div.board').length) _currentPos=0;
					var $board = $('div.board').eq(_currentPos);
					$board.addClass('active');
					if ($board.offset().top+$board.height()>window.innerHeight){
						window.scrollTo(0,$board.offset().top);
					}
					else{
						if (window.scrollY>$board.offset().top){
							window.scrollTo(0,$board.offset().top);
						}
					}
				}		
			};
			_speedChanged(_timer.interval);
		};
		// end __init
	}
	
	//------------BEGIN of PLAYER METHODS ------------------//
	var methodsPlayer = {		
		//-------------Begin of INIT---------------//
		init : function(options){
			//Begin of INIT method
			if (_soundSource()=='server'){
				$('div.fullscreen').hide();
			}
    		return this.each(function(){    			
    			var $this = $(this);
    			var boards = $this.data('boards');
				if(typeof(boards) == 'undefined' && options && options.boards) {
					_init($this,options.boards);
				}				
			}); 
			//END of INIT method
    		return this;
		},  

		//Begin of play action on picture
		// TODO: Testing it:
		/*
		 * $('div.paper').boardplayer('playAction',0,'select')
		 * $('div.paper').boardplayer('playAction',0,'go')		
		 */
		playAction: function(index, action){
			_playActionOnPictoAt(this,index,action);
			return this;
		},
		//End of play action on picture
		
		
		//Begin of select 
		select: function(){
			var $this=this;
			if (_timer && (_timer.locked==false)){
				_timer.stop();
			}
			var entry = $this.data('entry');			
			if (entry){
				// selected sheet
				var sheet=entry.sheets[entry.activesheet];
				if (sheet.plugin){
					sheet.plugin[sheet.title.text]('select');
					if (_isrunning){
						_timer.start();
					}
				}
				else{
					_playActionOnPictoAt($this,_currentPos,'go',function(){
						if (_isrunning){
							// it needs to update the entry
							var entry=$this.data('entry');
							if (entry){
								var sheet=entry.sheets[entry.activesheet];
								if (sheet){
									if (sheet.type=='sheet'){
										_colors.set($('div.imgcontainer'),'background','transparent').parent().removeClass('highlighted').addClass('opaque');										
									}
									_playActionOnPictoAt($this,_currentPos,'select');
									_timer.start();										
								}
							}
						}
						else{
							_playActionOnPictoAt($this,_currentPos,'select');
						}
					});					
				}
			}
			else{
				var boards = this.data('boards');
				if (boards && boards.length>0 && _currentPos<boards.length && _currentPos>=0){
					_setBoard(this,_currentPos);					
					if (_isrunning){	
						_colors.set($('div.imgcontainer'),'background','transparent').parent().removeClass('highlighted').addClass('opaque');
						_playActionOnPictoAt($this,_currentPos,'select');
						_timer.start();
					}
					else{
						_playActionOnPictoAt($this,_currentPos,'select');
					}
				}
			}
			return this;
		},
		//End of select
		
		//Begin of play action on picture
		/* TODO: Testing it:
		 * $('div.paper').boardplayer('playAction',0,'select')
		 * $('div.paper').boardplayer('playAction',0,'go')		
		 */
		play: function(opt){
			var $this = this;			
			if (_timer && _timer.enabled){
				return this.boardplayer('select');
			}
			//------------------------------
			_isrunning=true;
			$('.switch1>div.icon21').removeClass('icon21-209').removeClass('icon21-152').addClass('icon21-102');
			var entry = $this.data('entry');			
			if (entry){
				// selected sheet
				var sheet=entry.sheets[entry.activesheet];
				if (sheet.plugin){
					sheet.plugin[sheet.title.text]('play');
				}
				else{
					if (sheet['firstpicto']==sheet['lastpicto']){
						return this;
					}									
					_currentPos=sheet['firstpicto'];
					if (_currentPos<0)
						return this;
					_speedChanged(_timer.interval);
					_colors.reset(_colors.reset($('div.imgcontainer')).parent()).removeClass('highlighted').addClass('opaque');
					_playActionOnPictoAt($this,_currentPos,'select');
				}				
			}
			else{
				// several projects
				_currentPos=0;
				_speedChanged(_timer.interval);
				$('div.board').removeClass('active').eq(_currentPos).addClass('active');				
			}			
			_timer.start();
			return this;
		},
		//End of play action on picture	
		
		//Begin of STOP
		stop: function(){
			var $this=this;
			_isrunning=false;
			if (_timer && _timer.enabled){
				_timer.stop();				
			}
			$('.switch1>div.icon21').removeClass('icon21-152').removeClass('icon21-102').addClass('icon21-209');
			var entry = $this.data('entry');			
			if (entry){
				// selected sheet
				var sheet=entry.sheets[entry.activesheet];
				if (sheet.type=='sheet'){
					_setActiveSheet($this,entry.activesheet, true);	
				}
				else if (sheet.type=='plugin'){
					sheet.plugin[sheet.title.text]('stop');
				}
			}
			return this;
		},
		//End of STOP action on picture
		
		//Begin of ISpeed
		ispeed: function(){		
			var $this=this;
			if (_timer){
				_speedChanged(_timer.ispeed());
			}			
			return this;
		},
		//EndBegin of ISpeed
		
		//Begin of DSpeed
		dspeed: function(){			
			if (_timer){				
				_speedChanged(_timer.dspeed());
			}
			return this;
		},
		//EndBegin of DSpeed
		
		//Begin of chattext
		chattext: function(){			
			var $this=this;
			var entry = $this.data('entry');
			entry.chat.text=(!entry.chat.text);
            $('button.chattext>div').css('opacity',entry.chat.text   ? '1' :'0.3');
			return this;
		},
		//EndBegin of chattext
		
		//Begin of chatimage
		chatimage: function(){			
			var $this=this;
			var entry = $this.data('entry');
			entry.chat.image=(!entry.chat.image);
            $('button.chatimage>div').css('opacity',entry.chat.image ? '1' :'0.3');
			return this;
		},
		//EndBegin of chattext
		
		//Begin of chattext
		chatsound: function(){			
			var $this=this;
			var entry = $this.data('entry');
			entry.chat.sound=(!entry.chat.sound);
            $('button.chatsound>div').css('opacity',entry.chat.sound ? '1' :'0.3');
			return this;
		},
		//EndBegin of chattext

		//Begin of status
		status: function(){			
			return _isrunning?'busy':'idle'; 
		},
		//EndBegin of status
		
		//Begin of onchar 
		onchar: function(code){
			var $this=this;
			if (_timer && (_timer.enabled)){
				_timer.stop();
			}
			var entry = $this.data('entry');			
			if (entry){
				// selected sheet
				var sheet=entry.sheets[entry.activesheet];
				if (sheet.plugin){
					sheet.plugin[sheet.title.text]('onchar',code);
					if (_isrunning){
						_timer.start();
					}
				}
			}
		},
		//EndBegin of onchar
		
		//Begin of onchar 
		ontimeout: function(code){
			var $this=this;
			if (!_isrunning)
				return;
			$('.switch1>div.icon21').removeClass('icon21-209').removeClass('icon21-102').addClass('icon21-152');
			var entry = $this.data('entry');			
			if (entry){				
				var sheet=entry.sheets[entry.activesheet];
				if (sheet.plugin){
					sheet.plugin[sheet.title.text]('ontimeout');
				}
			}
			$this.boardplayer('stop');
			return true;
		},
		//EndBegin of onchar
		
		
	};

	$.fn.boardplayer = function(method) {		    
	    // Method calling logic		
		if (methodsPlayer[method]) {
			return methodsPlayer[method].apply(this, Array.prototype.slice.call( arguments, 1 ));
		} 
		else if ( typeof method === 'object' || ! method ) {
			return methodsPlayer.init.apply( this, arguments );
		} 
		else {
			$.error( 'Method ' +  method + ' does not exist on jQuery.boardplayer' );
		}
		
	};
	
})(jQuery);
