// $Id$
(function($) {

  /**
   * 
   * ImageMarker object.
   * 
   * Note that this object has a hard dependency to the Suzuki.ImageMap object.
   * Click handlers to update / remove coordinates need to push the new information
   * back to Drupal.ImageMap.
   * 
   */  
  Drupal.ImageMarker = function(x, y, text) {
    
    this.x = x;
    this.y = y;
    this.description = text;
    this.element = null;
    this.id = x + "-" + y;
    
    this.editProperties = function() {

      var self = this;
      if ($('#imagemap-edit').find('.imagemap-edit-x').length == 0) {
        this.attachForm();
      }
      $('input[name="imagemap-edit-x"]').val(this.x);
      $('input[name="imagemap-edit-y"]').val(this.y);
      $('textarea[name="imagemap-edit-description"]').val(this.description);
            
    };
    
    this.attachForm = function() {
      $('#imagemap-edit')
        .append($('<label>X</label>'))
        .append($('<input readonly="readonly" name="imagemap-edit-x" class="imagemap-edit-x" />'))
        .append($('<label>Y</label>'))
        .append($('<input readonly="readonly" name="imagemap-edit-y" class="imagemap-edit-y" />'))
        .append($('<label>Description</label>'))
        .append($('<textarea name="imagemap-edit-description" class="imagemap-edit-description text-full form-textarea"></textarea>'))
        .append($('<input type="button" class="imagemap-button" name="imagemap-edit-submit" value="' + Drupal.t('Save') + '" />')
          .click(function() {
            Drupal.ImageMap.saveCoordinates();
          }))
        .append($('<input type="button" class="imagemap-button" name="imagemap-edit-remove" value="' + Drupal.t('Remove') + '" />')
          .click(function() {
            Drupal.ImageMap.removeCoordinate();
          }));
    };
    
    this.setElement = function($element) {
      this.element = $element;
    };
    
  };
  
  
  /**
   * 
   * ImageMap object.
   * 
   */
  Drupal.ImageMap = Drupal.ImageMap || {};

  Drupal.ImageMap.coordinates = new Array();
  Drupal.ImageMap.pointer = $('<a class="bullet" href="#" rel=""></a>');
  Drupal.ImageMap.map = null;
  Drupal.ImageMap.currentMarker = '';

  // Init
  Drupal.ImageMap.init = function() {
    
    Drupal.ImageMap.map.click(function(e) {
      if($(e.target).is('img')) {
        Drupal.ImageMap.addCoordinate(e.layerX - Drupal.ImageMap.pointer.width() - (Drupal.ImageMap.pointer.width() / 2), e.layerY - (Drupal.ImageMap.pointer.height() / 2), Drupal.t('add description'));
      }
    });
    
    Drupal.ImageMap.initMarkers();

  };
  
  // addCoordinate
  Drupal.ImageMap.addCoordinate = function(x, y, text) {
    
    // Create a marker object.
    var marker = new Drupal.ImageMarker(x, y, text);
    var markerElement = Drupal.ImageMap.pointer.clone();
    markerElement.attr('rel', marker.id)
      .attr('alt', marker.description)
      .attr('title', marker.description);
    marker.setElement(markerElement);
    
    // Append the new marker in the DOM.
    Drupal.ImageMap.map.append(marker.element);
    
    // Add the marker to the screen.
    Drupal.ImageMap.processMarker(marker);
    
    // Stash the marker in the object.
    Drupal.ImageMap.coordinates[marker.id] = marker;
    
    // Set the focus the new one.
    Drupal.ImageMap.setFocus(marker.id);
    
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
      Drupal.ImageMap.coordinates[id].element
        .attr('alt', Drupal.ImageMap.coordinates[id].description)
        .attr('title', Drupal.ImageMap.coordinates[id].description);
      
    }
    
    // Save the markers to the textarea.
    var markers = new Array();
    $('.imagemap-coordinates textarea').val('');
    for (var n in Drupal.ImageMap.coordinates) {
      var marker = Drupal.ImageMap.coordinates[n];
      markers.push(jQuery.param({x: marker.x, y: marker.y, id: marker.id, description: marker.description}, true));
    }
    $('.imagemap-coordinates textarea').val(markers.join(";"));
    
  };
  
  // setFocus
  Drupal.ImageMap.setFocus = function(id) {
    Drupal.ImageMap.currentMarker = id;
    Drupal.ImageMap.coordinates[Drupal.ImageMap.currentMarker].editProperties();
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
     .click(function() {
       Drupal.ImageMap.setFocus(marker.id);
       return false;
     });
  
  };
  
  // initMarkers
  Drupal.ImageMap.initMarkers = function() {

    Drupal.ImageMap.map.children('a.bullet').each(function(){
      var coords = $(this).attr('rel').split('-');
      var description = $(this).attr('alt');
      var marker = new Drupal.ImageMarker(coords[0], coords[1], description);
      marker.setElement($(this));
      Drupal.ImageMap.coordinates[marker.id] = marker;
    });
    
    Drupal.ImageMap.processMarkers();
    
  };
  
  

  /**
   * 
   * Drupal behaviors.
   * 
   */
  Drupal.behaviors.ImageMap = {

    attach : function(context, settings) {
      Drupal.ImageMap.map = $("#media-imagemap");
      Drupal.ImageMap.init();
    }

  };

})(jQuery);