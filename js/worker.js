/**
 * Forces an update on a list of numerical fields, also making sure that
 * any undefined fields are set to 0.
 * @param {string[]} attrs
 * @param {function} cb
 */
function forceUpdate(attrs, cb) {
  parseAttrs(attrs, values => {
    let tempValues = {};
    _.each(attrs, attr => {
      tempValues[attr] = -9999;
    });
    setAttrs(tempValues);
    setAttrs(values);
  });
}


function onChange(attrs, cb) {
  attrs = _.map(attrs, attr => {
    return 'change:' + attr;
  }).join(' ');
  on(attrs, cb);
}

function onChangeParse(attrs, cb) {
  onChange(attrs, () => {
    parseAttrs(attrs, cb);
  });
}

/**
 * Gets the specified attributes and parses them as an integer or 0.
 */
function parseAttrs(attrs, cb) {
  getAttrs(attrs, function(values) {
    _.each(attrs, function(attr) {
      if(_.isUndefined(values[attr]))
        values[attr] = 0;
      else if(!isNaN(values[attr]))
        values[attr] = parseInt(values[attr]);
    });
    cb(values);
  });
}

// Primary attr totals
function updatePrimaryAttrTotal(name) {
  let attrs = _.map(['Base', 'Perks', 'Other','Temp'], attr => {
    return name + attr;
  });
  onChangeParse(attrs, values => {
    setAttrs({
      [name + 'Total']: _.chain(values).values(values).reduce((m, n) => { return m + n; }).value()
    });
  });
}
updatePrimaryAttrTotal('mind');
updatePrimaryAttrTotal('body');
updatePrimaryAttrTotal('heart');

// Skills
function updateSkills(attrsTotal) {
  getSectionIDs('repeating_skills', ids => {
    _.each(ids, id => {
      var prefix = 'repeating_skills_' + id + '_';
      var attrs = _.map(['attr', 'trained', 'improved', 'greater', 'other', 'temp', 'rolltype', 'hasArmorPenalty'], name => {
        return prefix + name;
      });
      attrs.push('armorPenalty');

      parseAttrs(attrs, values => {
        values = {
          attr: values[prefix + 'attr'],
          trained: values[prefix + 'trained'],
          improved: values[prefix + 'improved'],
          greater: values[prefix + 'greater'],
          other: values[prefix + 'other'],
          temp: values[prefix + 'temp'],
          rolltype: values[prefix + 'rolltype'],
          hasArmorPenalty: values[prefix + 'hasArmorPenalty'],
          armorPenalty: values['armorPenalty']
        };
        var attrTotal = 0;
        if(values.attr === 'mind')
          attrTotal = attrsTotal.mind;
        else if(values.attr === 'body')
          attrTotal = attrsTotal.body;
        else if(values.attr === 'heart')
          attrTotal = attrsTotal.heart;

        var total = attrTotal + values.other + values.temp;
        if(values.improved)
          total += 2;
        if(values.greater)
          total += 2;
        if(values.hasArmorPenalty === 'Yes')
          total -= values.armorPenalty;

        var dice = '2d6';
        if(values.greater)
          dice = '3d6d1r<1';
        else if(values.improved || values.trained)
          dice = '3d6d1';

        if(values.rolltype === 'adv')
          dice = `{${dice},${dice}}kh1`;
        if(values.rolltype === 'dis')
          dice = `{${dice},${dice}}kl1`;

        var equation = total + ' + ' + dice;

        setAttrs({
          [prefix + 'attrValue']: attrTotal,
          [prefix + 'total']: total,
          [prefix + 'equation']: equation,
          debug: values.armorPenalty
        }, { silent: true });
      });
    });
  });
}

onChangeParse(['mindTotal', 'bodyTotal', 'heartTotal', 'armorPenalty'], values => {
  var attrsTotal = {
    mind: values.mindTotal,
    body: values.bodyTotal,
    heart: values.heartTotal
  };
  updateSkills(attrsTotal);
});

on('change:repeating_skills', () => {
  parseAttrs(['mindTotal', 'bodyTotal', 'heartTotal'], values => {
    var attrsTotal = {
      mind: values.mindTotal,
      body: values.bodyTotal,
      heart: values.heartTotal
    };
    updateSkills(attrsTotal);
  });
});

// Hide power points
on('change:repeating_powers', function() {
  getSectionIDs('repeating_powers', ids => {
    _.each(ids, id => {
      var prefix = 'repeating_powers_' + id + '_';
      parseAttrs([prefix + 'type'], values => {
        var type = values[prefix + 'type'];
        var hidePowerPoints = type === 'points' ? 0 : 1;

        setAttrs({
          [prefix + 'hidePowerPoints']: hidePowerPoints
        });
      });
    });
  });
});
