// $Id$
(function($) {

  /**
   * 
   * ImageMarker object.
   * 
   * Note that this object has a hard dependency to the Drupal.ImageMap object.
   * @see imagemaps.admin.js for an example of prototype overrides.
   * 
   */  
  Drupal.ImageMarker = function(x, y, text) {
    
    this.x = x;
    this.y = y;
    this.description = text;
    this.element = null;
    this.id = x + "-" + y;
    this.active = false;
    
    this.setElement = function($element) {
      this.element = $element;
    };
    
    this.onHover = function(event) {

      var $hoverElement = $('<span class="imagemap-hover-text">' + this.description  + '</span>');
      
      this.element
        .append($hoverElement
          .css({left: "+20px", top: "-" + $hoverElement.height()  +"px"})
          .hide()
          .fadeIn())
        .attr('title', '');

    };
    
    this.onHoverOut = function(event) {
      this.element.attr('title', this.description);
      if (this.active == false) {
        this.element.find('.imagemap-hover-text').fadeOut('slow').remove();
      }
    };
    
    this.onClick = function(event) {

      if($.isFunction(this.editProperties)) {
        this.editProperties();
      }
      else {
        if (this.active === true) {
          this.active = false;
          this.onHoverOut();
        }
        else {
          this.active = true;
          this.onHover();          
        }        
      }
      
    };
    
    return this;
    
  };
  
  
  /**
   * 
   * ImageMap object.
   * 
   */
  Drupal.ImageMap = Drupal.ImageMap || {};

  Drupal.ImageMap.coordinates = new Array();
  Drupal.ImageMap.pointer = $('<a class="bullet" href="#" rel="" title="" alt=""></a>');
  Drupal.ImageMap.map = null;
  Drupal.ImageMap.currentMarker = '';

  // Init
  Drupal.ImageMap.init = function() {

    Drupal.ImageMap.map.click(function(e) {
      
      if($(e.target).is('img')) {
        var x = e.layerX - (Drupal.ImageMap.pointer.width() / 2);
        var y = e.layerY - (Drupal.ImageMap.pointer.height() / 2);
        Drupal.ImageMap.addCoordinate(x, y, Drupal.t('add description'));
      }
    });
    
  };
  
  // attachMarkers
  Drupal.ImageMap.attachMarkers = function() {

    Drupal.ImageMap.map.children('a.bullet').each(function(){
      var coords = $(this).attr('rel').split('-');
      var description = $(this).attr('alt');
      var marker = new Drupal.ImageMarker(coords[0], coords[1], description);
      marker.setElement($(this));
      Drupal.ImageMap.coordinates[marker.id] = marker;
    });
    
    Drupal.ImageMap.processMarkers();
    
  };
  
  // addCoordinate
  Drupal.ImageMap.addCoordinate = function(x, y, text) {

    // Create a marker object.
    var marker = new Drupal.ImageMarker(x, y, text);
    var markerElement = Drupal.ImageMap.pointer.clone();

    markerElement.attr('rel', marker.id)
      .attr('title', marker.description)
      .attr('alt', marker.description);
    marker.setElement(markerElement);
    
    // Append the new marker in the DOM.
    Drupal.ImageMap.map.append(marker.element);
    
    // Add the marker to the screen.
    Drupal.ImageMap.processMarker(marker);
    
    // Stash the marker in the object.
    Drupal.ImageMap.coordinates[marker.id] = marker;
    
    // Set the focus the new one.
    Drupal.ImageMap.setFocus(marker.id);
    // Enforce a click.
    marker.element.click();
    
    // Save the current markers in the coordinates area.
    Drupal.ImageMap.saveCoordinates();
    
  };
  
  // removeCoordinate
  Drupal.ImageMap.removeCoordinate = function() {
    
    var id = $('input[name="imagemap-edit-x"]').val() + '-' + $('input[name="imagemap-edit-y"]').val();

    // Remove the coordinate from screen.
    Drupal.ImageMap.coordinates[id].element.remove();
    delete(Drupal.ImageMap.coordinates[id]);
    
    // Reset current marker and update the coordinates.
    Drupal.ImageMap.currentMarker = '';
    Drupal.ImageMap.saveCoordinates();
    
    // Remove the attached form.
    $('#imagemap-edit').empty();
    
  };
  
  // saveCoordinates
  Drupal.ImageMap.saveCoordinates = function() {
    
    // Check the latest description for updates.
    if (Drupal.ImageMap.currentMarker != '') {
            
      var id = Drupal.ImageMap.currentMarker;
      Drupal.ImageMap.coordinates[id].description = $('textarea[name="imagemap-edit-description"]').val();

      // Change the hover alt and title text.
      Drupal.ImageMap.coordinates[id].element.attr('alt', Drupal.ImageMap.coordinates[id].description)
      Drupal.ImageMap.coordinates[id].element.attr('title', Drupal.ImageMap.coordinates[id].description);
      
    }
    
    // Save the markers to the textarea.
    var markers = new Array();
    $('.imagemap-coordinates textarea').val('');
    for (var n in Drupal.ImageMap.coordinates) {
      var marker = Drupal.ImageMap.coordinates[n];
      markers.push(jQuery.param({x: marker.x, y: marker.y, id: marker.id, description: marker.description}, true));
    }
    console.log(markers);
    $('.imagemap-coordinates').val(markers.join(";"));
    
  };
  
  // setFocus
  Drupal.ImageMap.setFocus = function(id) {

    Drupal.ImageMap.currentMarker = id;

  };
  
  // processMarkers
  Drupal.ImageMap.processMarkers = function() {
    
    for (var n in Drupal.ImageMap.coordinates) {
      var marker = Drupal.ImageMap.coordinates[n];
      Drupal.ImageMap.processMarker(marker);
    }
    
  };
  
  // processMarkers
  Drupal.ImageMap.processMarker = function(marker) {

    marker.element.css({left: marker.x + 'px', top: marker.y + 'px'})
     .hide()
     .fadeIn()
     .click(function(event) {
       Drupal.ImageMap.setFocus(marker.id);
       Drupal.ImageMap.coordinates[marker.id].onClick(event);
       return false;
     })
     .hover(function(event) {
       Drupal.ImageMap.coordinates[marker.id].onHover(event);
       return false;
     },
     function(event) {
       Drupal.ImageMap.coordinates[marker.id].onHoverOut(event);
       return false;
     });
  
  };
  
  

  /**
   * 
   * Drupal behaviors.
   * 
   */
  Drupal.behaviors.ImageMap = {

    attach : function(context, settings) {
    
      Drupal.ImageMap.map = $("#media-imagemap");
      
      // Attach the markers to the imagemap.
      Drupal.ImageMap.attachMarkers();
    }

  };

})(jQuery);