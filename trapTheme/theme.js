(() => {
  'use strict';

  // The name used by this script to send alerts to the GM in the chat.
  const CHAT_NAME = 'MLP_RIM5_space';

  // A mapping of saving throw short names to their attribute names.
  const SAVE_NAMES = {
    'str': 'strength_saving_throw_mod_with_sign',
    'dex': 'dexterity_saving_throw_mod_with_sign',
    'con': 'constitution_saving_throw_mod_with_sign',
    'int': 'intelligence_saving_throw_mod_with_sign',
    'wis': 'wisdom_saving_throw_mod_with_sign',
    'cha': 'charisma_saving_throw_mod_with_sign'
  };

  // Register the theme with ItsATrap.
  on('ready', () => {
    /**
     * A theme for the 5th Edition OGL character sheet.
     * @implements ItsATrap#TrapTheme
     */
    class TrapThemeMLPRIM5Space extends TrapTheme {
      /**
       * @inheritdoc
       */
      get name() {
        return CHAT_NAME;
      }

      /**
       * @inheritdoc
       */
      activateEffect(effect) {
        let content = new HtmlBuilder('div');

        var row = content.append('.paddedRow');
        row.append('span.bold', 'Target:');
        row.append('span', effect.victim.get('name'));

        content.append('.paddedRow', effect.message);

        let table = TrapTheme.htmlTable(content, '#a22', effect);
        let tableView = table.toString(TrapTheme.css);
        effect.announce(tableView);
      }

      /**
       * @inheritdoc
       */
      getThemeProperties(trapToken) {
        let effect = (new TrapEffect(trapToken)).json;

        let LPAREN = '&#40;';
        let RPAREN = '&#41;';

        let LBRACE = '&#91;';
        let RBRACE = '&#93;';

        return [
          {
            id: 'spotDif',
            name: 'Spot Dif',
            desc: 'The difficulty to notice the trap by passive perception.',
            value: effect.spotDif
          }
        ];
      }

      /**
       * @inheritdoc
       */
      modifyTrapProperty(trapToken, argv) {
        let effect = (new TrapEffect(trapToken)).json;

        let prop = argv[0];
        let params = argv.slice(1);

        if(prop === 'spotDif')
          effect.spotDif = parseInt(params[0]);

        trapToken.set('gmnotes', JSON.stringify(effect));
      }

      /**
       * @inheritdoc
       */
      passiveSearch(trap, charToken) {
        let effect = (new TrapEffect(trap, charToken)).json;
        let character = getObj('character', charToken.get('represents'));
        if(!character)
          return;

        // Find the perception skill.
        return TrapTheme.getSheetRepeatingRow(character, 'skills', attrs => {
          return attrs.name && attrs.name.get('current').toLowerCase() === 'perception';
        })

        // Calculate passive perception.
        .then(row => {
          if(row) {
            let passivePerc = row.total.get('current');
            let trained = row.trained.get('current');
            if(trained)
              passivePerc += 8;
            else
              passivePerc += 6;
            return passivePerc;
          }
          else {
            // If the character doesn't have the Perception skill,
            // just use passive Mind.
            return TrapTheme.getSheetAttr(character, 'mindTotal')
            .then(mind => {
              return mind + 6;
            });
          }
        })

        // Compare to the spot Difficulty.
        .then(passivePerc => {
          if(passivePerc >= effect.spotDif) {
            let html = TrapTheme.htmlNoticeTrap(character, trap);
            ItsATrap.noticeTrap(trap, html.toString(TrapTheme.css));
          }
        })
        .catch(err => {
          sendChat('Trap theme: ' + this.name, '/w gm ' + err.message);
          log(err.stack);
        });
      }
    }
    ItsATrap.registerTheme(new TrapThemeMLPRIM5Space());
  });
})();
