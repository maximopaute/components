/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ResolvedResource} from '../../update-tool/component-resource-collector';
import {MigrationRule} from '../../update-tool/migration-rule';

import {OutputNameUpgradeData} from '../data';
import {
  findOutputsOnElementWithAttr,
  findOutputsOnElementWithTag,
} from '../html-parsing/angular';
import {getVersionUpgradeData, RuleUpgradeData} from '../upgrade-data';

/**
 * Rule that walks through every inline or external HTML template and switches
 * changed output binding names to the proper new output name.
 */
export class OutputNamesRule extends MigrationRule<RuleUpgradeData> {
  /** Change data that upgrades to the specified target version. */
  data: OutputNameUpgradeData[] = getVersionUpgradeData(this, 'outputNames');

  // Only enable the migration rule if there is upgrade data.
  ruleEnabled = this.data.length !== 0;

  visitTemplate(template: ResolvedResource): void {
    this.data.forEach(name => {
      const whitelist = name.whitelist;
      const relativeOffsets: number[] = [];

      if (whitelist.attributes) {
        relativeOffsets.push(
            ...findOutputsOnElementWithAttr(template.content, name.replace, whitelist.attributes));
      }

      if (whitelist.elements) {
        relativeOffsets.push(
            ...findOutputsOnElementWithTag(template.content, name.replace, whitelist.elements));
      }

      relativeOffsets.map(offset => template.start + offset)
          .forEach(
              start => this._replaceOutputName(
                  template.filePath, start, name.replace.length, name.replaceWith));
    });
  }

  private _replaceOutputName(filePath: string, start: number, width: number, newName: string) {
    const updateRecorder = this.getUpdateRecorder(filePath);
    updateRecorder.remove(start, width);
    updateRecorder.insertRight(start, newName);
  }
}
