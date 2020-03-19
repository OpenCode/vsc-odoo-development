import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "vsc-odoo-development" is now active!');

	let disposable = vscode.commands.registerCommand('extension.dev.odoo.create.security.rule', () => {
		var editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showInformationMessage('No editor');
			return; // No open text editor
			}
		var selection = editor.selection;
		if (selection.isEmpty === true) {
			vscode.window.showErrorMessage('Select an odoo class _name or _inherit');
			return;
			}
		var text = editor.document.getText(selection);
		var regex = /(|.+)(_name|_inherit)(|.+)=(|.+)("|')(.+)("|')/g;
		var regexp = new RegExp(regex);
		var test_regexp = regexp.test(text);
		if (!test_regexp) {
			vscode.window.showErrorMessage('Select an odoo class _name or _inherit');
			return;
			}
		var match_regex = regex.exec(text);
		console.debug(match_regex);
		if (!match_regex) {
			return;
			}
		var odoo_class_dot = match_regex[6];
		var odoo_class_underscore = odoo_class_dot.split('.').join('_');
		// Get module name
		// Presume module strucure is compatible with Odoo/OCA guidelines
		var module_paths = editor.document.fileName.split('/');
		var module_name = module_paths[module_paths.length - 3];
		// rule id
		var security_rule = 'access_' + odoo_class_underscore + '_user,';
		// rule name
		security_rule += module_name + '.' + odoo_class_dot + ',';
		// rule model_id
		security_rule += 'model_' + odoo_class_underscore + ',';
		// rule group_id
		security_rule += 'base.group_user' + ',';
		// rule perms
		security_rule += '1,1,1,1';
		// Copy string to clipboard
		vscode.env.clipboard.writeText(security_rule);
		// Alert user about creation
		vscode.window.showInformationMessage(
			'Odoo security rule created in clipboard for ' + odoo_class_dot);
		});

	context.subscriptions.push(disposable);
}

export function deactivate() {}
