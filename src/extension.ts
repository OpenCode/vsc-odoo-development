import * as vscode from 'vscode';
import * as odoo_lib from 'odoo-xmlrpc';


function get_odoo_class() {
	// Get class name
	var editor = vscode.window.activeTextEditor;
	if (!editor) {
		vscode.window.showInformationMessage('No editor');
		return ''; // No open text editor
		}
	var selection = editor.selection;
	if (selection.isEmpty === true) {
		vscode.window.showErrorMessage('Select an odoo class _name or _inherit');
		return '';
		}
	var text = editor.document.getText(selection);
	var regex = /(|.+)(_name|_inherit)(|.+)=(|.+)("|')(.+)("|')/g;
	var regexp = new RegExp(regex);
	var test_regexp = regexp.test(text);
	if (!test_regexp) {
		vscode.window.showErrorMessage('Select an odoo class _name or _inherit');
		return '';
		}
	var match_regex = regex.exec(text);
	if (!match_regex) {
		return '';
		}
	var odoo_class = match_regex[6];
	return odoo_class;
}


function create_model_table(odoo_class: string, odoo: any) {
	var inParams = [];
	inParams.push([['model', '=', odoo_class]]);
	inParams.push(['id', 'model', 'field_id']);
	inParams.push(0); // offset
	inParams.push(5); // limit
	var params = [];
	params.push(inParams);
	odoo.execute_kw('ir.model', 'search_read', params,
		function (err: any, value: any) {
			if (err) {
				vscode.window.showErrorMessage('Error: ' + err);
				return;
				}
		if (value.length === 0) {
			vscode.window.showErrorMessage('Impossible to find data for ' + odoo_class);
			}
		// vscode.window.showInformationMessage(value[0].model);
		const field_ids = value[0].field_id;

		
		var inParams = [];
		inParams.push(field_ids); //ids
		inParams.push(['id', 'name', 'ttype', 'modules']); //fields
		var params = [];
		params.push(inParams);
		odoo.execute_kw('ir.model.fields', 'read', params, function (err2: any, fields: any) {
			if (err2) { return; }
			// Show results
			const panel = vscode.window.createWebviewPanel(
				'odoo.dev.model.result.' + odoo_class,
				'Model:' + odoo_class,
				vscode.ViewColumn.One, );
			var content_html = `<!DOCTYPE html>
				<html lang="en">
				<head>
					<meta charset="UTF-8">
					<meta name="viewport" content="width=device-width, initial-scale=1.0">
					<title>Cat Coding</title>
					<style>
					table {
						width: 100%;
					}
					table, th, td {
						border: 1px solid white;
						border-collapse: collapse;
						padding: 3px;
						padding: 3px;
					}
					td {
						vertical-align: middle;
					}
					</style>
				</head>
				<body>
					<div style="width:100%;">
						<table>
							<thead>
								<tr>
									<th>ID</th>
									<th>FIELD NAME</th>
									<th>TYPE</th>
									<th>IN APPS</th>
								</tr>
							</thead>
							<tbody>`;
			var i = 0;
			for (i = 0; i < fields.length; i++) {
				content_html += '<tr>';
				content_html += '<td>' + fields[i].id + '</td>';
				content_html += '<td>' + fields[i].name + '</td>';
				content_html += '<td>' + fields[i].ttype + '</td>';
				content_html += '<td>' + fields[i].modules + '</td>';
				content_html += '</tr>';
			}
			content_html += `</tbody>
						</table>
					</div>
				</body>
				</html>`;
			panel.webview.html = content_html;
			});
		});
	}


export function activate(context: vscode.ExtensionContext) {

	console.log('Extension "vsc-odoo-development" is now active!');

	let disposable_security_rule = vscode.commands.registerCommand('extension.dev.odoo.create.security.rule', () => {
		// Get class name
		var odoo_class_dot = get_odoo_class();
		if (odoo_class_dot === '') {
			return;
			}
		var editor = vscode.window.activeTextEditor;
		if (!editor) {return;}
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

	context.subscriptions.push(disposable_security_rule);

	let disposable_model_remote = vscode.commands.registerCommand('extension.dev.odoo.model.from.remote', () => {
		// Get class name
		var odoo_class = get_odoo_class();
		if (odoo_class === '') {
			return;
			}
		// Open connection with Odoo
		var odoo_dev_config = vscode.workspace.getConfiguration('odoo.dev');
		var odoo = new odoo_lib({
			url: odoo_dev_config.get('OdooRemoteUrl'),
			port: odoo_dev_config.get('OdooRemotePort'),
			db: odoo_dev_config.get('OdooRemoteDb'),
			username: odoo_dev_config.get('OdooRemoteUser'),
			password: odoo_dev_config.get('OdooRemotePassword')
			});
		odoo.connect(function (err: any) {
			if (err) {
				vscode.window.showErrorMessage('Impossibile to connect with Odoo');
				return;
				}
			create_model_table(odoo_class, odoo);
			});
		});

	context.subscriptions.push(disposable_model_remote);

}


export function deactivate() {}
