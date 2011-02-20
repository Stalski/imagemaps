<?php
// $Id$

/**
 * @file
 * Administration tasks for imagemaps.
 *
 */


/**
 * Create and manage imagemaps.
 *
 * @param array $field_image
 *   The image field that will have coordinates on top.
 * @param array $field_coordinates
 *   A textfield where we will store the coordinates.
 * @param String $image_style
 *   The image style for the imagemap.
 */
function imagemaps_manage_display(& $field_image, & $field_coordinates, $image_style) {

  $language = isset($field_image['#language']) ? $field_image['#language'] : 'und';

  if (isset($field_image[$language][0]['#default_value'], $field_image[$language][0]['#default_value']['uri'])) {

    $field_coordinates['#prefix'] = _imagemaps_render($field_image[$language][0]['#default_value']['uri'], $field_coordinates[$language][0]['value']['#default_value'], $image_style, $language);

    $properties = _imagemaps_load_imagestyle($image_style);
    $field_coordinates['#prefix'] .= '<div id="imagemap-edit" style="width: ' . (900 - $properties['width']) . 'px; height: ' . $properties['height'] . 'px"></div>';

    // Hide the coordinates.
    $field_coordinates['#prefix'] .= '<br style="clear: both; width: 100%;" /><div style="display: none;">';
    $field_coordinates['#suffix'] = '</div>';

    // Add a class to handle.
    if (!isset($field_coordinates['#attributes']['class'])) {
      $field_coordinates['#attributes']['class'] = array();
    }
    $field_coordinates['#attributes']['class'][] = 'imagemap-coordinates';

  }

  // Attach the javascript and css files for the imagemap UI.
  $field_coordinates['#attached'] = array(
    'js' => array(
      drupal_get_path('module', 'imagemaps') . '/imagemaps.js',
      drupal_get_path('module', 'imagemaps') . '/imagemaps.admin.js'),
    'css' => array(
      drupal_get_path('module', 'imagemaps') . '/imagemaps.css')
  );

}

/**
 * Page callback with a configuration form for imagemaps.
 */
function imagemaps_settings_page() {

  $form = array('#prefix' => t('As soon as forms are selected, you will be able to choose the fields used for imagemaps in that context. There is a tab available for each form.'));

  // The forms.
  $options = array();
  foreach(entity_get_info() as $entity_name => $entity) {
    if (isset($entity['fieldable']) && $entity['fieldable'] === TRUE) {
      if (isset($entity['bundles'])) {
        $options[$entity_name] = array();
        foreach (array_keys($entity['bundles']) as $bundle) {
          $options[$entity_name . '__' . $bundle] = $bundle;
        }
      }
      else {
        //$options += drupal_map_assoc(array($entity_name));
      }
    }
  }
  $form['imagemaps_forms'] = array(
    '#type' => 'select',
    '#title' => t('Select forms to use imagemaps on'),
    '#default_value' => variable_get('imagemaps_forms', ''),
    '#options' => $options,
    '#multiple' => TRUE,
  );

  // The fields.
  $form['imagemaps'] = array(
    '#type' => 'vertical_tabs',
    '#theme_wrappers' => array('vertical_tabs'),
    '#prefix' => '<div>',
    '#suffix' => '</div>',
    '#title' => t('Imagemap forms'),
    '#tree' => TRUE
  );
  $form['#attached']['js'][] = 'misc/form.js';
  $form['#attached']['js'][] = 'misc/collapse.js';

  // Add the fields selection for each form.
  $forms = variable_get('imagemaps_forms', array());
  $fields = variable_get('imagemaps', array());

  if (!empty($forms)) {

    foreach ($forms as $imagemaps_form) {

      $form['imagemaps'][$imagemaps_form] = array(
        '#type' => 'fieldset',
        '#title' => t('Imagemap fields for @form', array('@form' => $imagemaps_form)),
        '#tree' => TRUE,
      );
      $parts = explode("__", $imagemaps_form);
      $params = array();
      $params['entity_type'] = $parts[0];
      if (count($parts) > 1) {
        $params['bundle'] = $parts[1];
      }
      $instances = field_read_instances($params);
      if (!empty($instances)) {
        $image_options = array();
        foreach ($instances as $instance) {
          if ($instance['widget']['type'] == 'image_image') {
            $image_options[$instance['field_name']] = $instance['label'];
          }
        }
        $data_options = array();
        foreach ($instances as $instance) {
          if ($instance['widget']['type'] == 'text_textarea') {
            $data_options[$instance['field_name']] = $instance['label'];
          }
        }
      }
      if (empty($image_options) || empty($data_options)) {

        $warning = t('Incomplete configuration found for @type. Every imagemap needs a textarea and an image field to properly function.', array('@type' => $imagemaps_form));
        if (empty($image_options)) {
          $warning .= t('<br />No image field found for this type.');
        }
        if (empty($image_options)) {
          $warning .= t('<br />No data field or textarea found for this type.');
        }
        $form['imagemaps'][$imagemaps_form]['error_message'] = array(
          '#markup' => $warning,
        );

      }
      else {

        $form['imagemaps'][$imagemaps_form]['field_image'] = array(
          '#type' => 'select',
          '#title' => t('Select the field for the image'),
          '#default_value' => isset($fields[$imagemaps_form]['field_image']) ? $fields[$imagemaps_form]['field_image'] : '',
          '#options' => $image_options,
        );
        $form['imagemaps'][$imagemaps_form]['field_data'] = array(
          '#type' => 'select',
          '#title' => t('Select the text field to store the coordinates.'),
          '#default_value' => isset($fields[$imagemaps_form]['field_data']) ? $fields[$imagemaps_form]['field_data'] : '',
          '#options' => $data_options,
        );
        $style_options = array();
        foreach (image_styles() as $style) {
          $style_options[$style['name']] = $style['name'];
        }
        $form['imagemaps'][$imagemaps_form]['field_image_style'] = array(
          '#type' => 'select',
          '#title' => t('Select the image style used.'),
          '#default_value' => isset($fields[$imagemaps_form]['field_image_style']) ? $fields[$imagemaps_form]['field_image_style'] : '',
          '#options' => $style_options,
        );
      }
    }
  }

  return system_settings_form($form);

}