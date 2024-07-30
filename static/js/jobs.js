
// Define constant icons
const success_alert_icon = "bi-check2";
const success_alert_style = "alert-success";
const danger_alert_icon = "bi-exclamation-triangle";
const danger_alert_style = "alert-danger";

// Define column index
const colIndexCommand = 5;
const colIndexOutput = 6;
const colIndexStatus = 4;
const colIndexActions = 1;


// Init Datatable
document.addEventListener('DOMContentLoaded', function () {
    let table = new DataTable('#example', {
        ordering: true,
        info: true,
        lengthMenu: [[5, 10, 25, 50, -1], [5, 10, 25, 50, "All"]],
        "iDisplayLength": 50,
        "pageLength": 10,
        dom: 'QBlfrtip',  //dom: 'Blfrtip',
        buttons: [
            'copy', 'csv', 'excel', 'pdf', 'print', 'colvis', 'colvisRestore'
        ],
        'ajax':{url: '/load-jobs', dataSrc: 'data'},
        columns: [
            { className: "details-control" },
            null,
            null,
            {
                //data: "Schedule Date/Time",
                render: function(data, type, row){
                    if(type === "sort" || type === "type"){
                        return data;
                    }
                    return moment(data).format("DD-MM-YYYY HH:mm");
                }
            },
            null
        ],

        "createdRow": function (row, data, dataIndex, cells) {
            // Define row job id for future usage
            let row_job_id = data[2];

            // Set Status icons
            if (data[colIndexStatus] == 0) {
                $(cells[colIndexStatus]).html('<a href="#" data-bs-toggle="tooltip" data-bs-placement="right" title="Scheduled"><i class="bi bi-alarm" style="color: darkslategrey"></i></a>');
            } else if (data[colIndexStatus] == 1) {
                $(cells[colIndexStatus]).html('<a href="#" data-bs-toggle="tooltip" data-bs-placement="right" title="Executed successfully"><i class="bi bi-caret-right-square-fill" style="color: #9CDBA6"></i></a>');  // mediumseagreen
            } else if (data[colIndexStatus] == 2) {
                $(cells[colIndexStatus]).html('<a href="#" data-bs-toggle="tooltip" data-bs-placement="right" title="Failed"><i class="bi bi-x-lg" style="color: #FFA38F"></i></a>');  // red  // Orange: #FFD18E
            } else if (data[colIndexStatus] == 10) {
                $(cells[colIndexStatus]).html('<a href="#" data-bs-toggle="tooltip" data-bs-placement="right" title="Cancelled"><i class="bi bi-ban-fill" style="color: #FFA38F"></i></a>');  // red  // Orange: #FFD18E
            }

            // Add icons for actions
            $(cells[colIndexActions]).html(`<div class="btn-group" role="group" aria-label="Row action"> <button type="button" class="btn btn-danger btn-sm" onclick="modalDelete(${row_job_id})" data-bs-toggle="modal" data-bs-target="#ModalDeletion"> <i class="bi bi-trash3-fill"></i> </button> </div>`);
        },
        "drawCallback": function( settings ) {
            // Init Bootstrap Tooltips
            const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
            const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));

            // Code Highlighting for command to execute
            document.querySelectorAll(".code-output").forEach( containerElement => codeHighlight(containerElement, containerElement.textContent))

        }
    });

    // Add event listener for opening and closing details
    $('#example tbody').on('click', 'td:first-child', function () {
        var tr = $(this).closest('tr');
        var row = table.row( tr );

        if ( row.child.isShown() ) {
            // This row is already open - close it
            row.child.hide();
            tr.removeClass('shown');
        }
        else {
            // Open this row
            row.child( format(row.data()) ).show();
            tr.addClass('shown');
        };
    });

    // Handle click on "Expand All" button
    $('#btn-show-all-children').on('click', function(){
        // Enumerate all rows
        table.rows().every(function(){
            // If row has details collapsed
            if(!this.child.isShown()){
                // Open this row
                this.child(format(this.data())).show();
                $(this.node()).addClass('shown');
            }
        });
    });

    // Handle click on "Collapse All" button
    $('#btn-hide-all-children').on('click', function(){
        // Enumerate all rows
        table.rows().every(function(){
            // If row has details expanded
            if(this.child.isShown()){
                // Collapse row details
                this.child.hide();
                $(this.node()).removeClass('shown');
            }
        });
    });
});

// Formatting function for row details - modify as you need
function format(d) {
    // `d` is the original data object for the row
    //html_output = `
    //  <div><b> Command </b></div>
    //  <div class="mono">` + d[colIndexCommand] + `</div>
    //  `
    //html_output = `<pre><code id="code-` + d[2] + `" class="code-output language-bash">` + d[colIndexCommand] + `</code></pre>`
    let code_highlighted =  hljs.highlight( d[colIndexCommand], { language: 'bash' } ).value;

    // Option 1
    let html_output = `<div class="mono">` + code_highlighted + `</div>`

    if (d[colIndexOutput] != "") {
        html_output += `
            <br>
            <hr>

            <div><b>Output </b></div>
            <div class="mono" style="white-space: pre">` + d[colIndexOutput] + `</div><br>`
    }

    // Option 2 (nested table)
    /*
    html_output = '<table cellpadding="5" cellspacing="0" border="0" style="padding-left:50px;">'+
        '<tr>'+
            '<td>Command:</td>'+
            '<td class="mono">' + code_highlighted + '</td>'+
        '</tr>';

    if (d[colIndexOutput] != "") { html_output +=
        '<tr>'+
            '<td>Output:</td>'+
            '<td class="mono" style="white-space:pre">'+ d[colIndexOutput] +'</td>'+
        '</tr>'+
    '</table>';
    }
    */

    return html_output;
}

function datatableFilterStatus() {
    let table = $('#example').DataTable();
    let value_selected = getSelectedValue();

    if (value_selected === "scheduled") {
        table.column( colIndexStatus ).search( "^0$", true, false ).draw();
    } else if (value_selected === "executed") {
        table.column( colIndexStatus ).search( "^1$", true, false).draw();
    } else if (value_selected === "failed") {
        table.column( colIndexStatus ).search( "^2$", true, false).draw();
    } else if (value_selected === "cancelled") {
        table.column( colIndexStatus ).search( "^10$", true, false).draw();
    } else {
        table.column( colIndexStatus ).search( "", true, false).draw();
    }
}
function datatableFilterStatus_(triggerElement) {
    let table = $('#example').DataTable();
    let value_selected = triggerElement.value;

    if (value_selected === "scheduled") {
        table.column( colIndexStatus ).search( "^0$", true, false ).draw();
    } else if (value_selected === "executed") {
        table.column( colIndexStatus ).search( "^1$", true, false).draw();
    } else if (value_selected === "failed") {
        table.column( colIndexStatus ).search( "^2$", true, false).draw();
    } else if (value_selected === "cancelled") {
        table.column( colIndexStatus ).search( "^10$", true, false).draw();
    } else {
        table.column( colIndexStatus ).search( "", true, false).draw();
    }
}

function scheduleTaskAjax() {

    if (document.querySelector('input[name=dateTimeMode]:checked').id == "radioDateTime") {
        if (document.querySelector("#DatetimeScheduleSelection").value === "") {
            document.querySelector("#scheduleTaskAlert").classList.remove(success_alert_style); // Style
            document.querySelector("#scheduleTaskAlert").classList.add(danger_alert_style);

            document.querySelector("#scheduleTaskAlertText").innerHTML=`<i class="bi ${danger_alert_icon}"></i> <strong>Fill the date/time field</strong>`;
            document.querySelector("#scheduleTaskAlert").classList.remove("d-none");

            return
        }

    } else if (document.querySelector('input[name=dateTimeMode]:checked').id == "radioRelativeTimes") {
        if (document.querySelector("#relativeTimeDataList").value === "") {
            document.querySelector("#scheduleTaskAlert").classList.remove(success_alert_style); // Style
            document.querySelector("#scheduleTaskAlert").classList.add(danger_alert_style);

            document.querySelector("#scheduleTaskAlertText").innerHTML=`<i class="bi ${danger_alert_icon}"></i> <strong>Fill the relative time field</strong>`;
            document.querySelector("#scheduleTaskAlert").classList.remove("d-none");

            return
        }

    }

    // Check for command text not being empty
    if (document.querySelector("#command").value === "") {
        document.querySelector("#scheduleTaskAlert").classList.remove(success_alert_style); // Style
        document.querySelector("#scheduleTaskAlert").classList.add(danger_alert_style);

        document.querySelector("#scheduleTaskAlertText").innerHTML=`<i class="bi ${danger_alert_icon}"></i> <strong>Fill the command field</strong>`;
        document.querySelector("#scheduleTaskAlert").classList.remove("d-none");

        return;
    }

    let data_to_send = {};
    data_to_send["csrfmiddlewaretoken"] = csrf_token;
    data_to_send["schedule_datetime"] = document.querySelector("#DatetimeScheduleSelection").value;
    data_to_send["schedule_relative_time"] = document.querySelector("#relativeTimeDataList").value;
    data_to_send["schedule_time_mode"] = ""
    if (document.querySelector('input[name=dateTimeMode]:checked').id == "radioDateTime") {
        data_to_send["schedule_time_mode"] = "absolute";
    } else if (document.querySelector('input[name=dateTimeMode]:checked').id == "radioRelativeTimes") {
        data_to_send["schedule_time_mode"] = "relative";
    }
    data_to_send["command"] = document.querySelector("#command").value;

    AJAX("/schedule-job/", data_to_send, 'POST')
        .then(function(result) {
            // convert result to JSON
            let result_json = JSON.parse(result)

            /* Inform about scheduled task */
            if (result_json['status'] === 0) {
              // show banner green with output
              document.querySelector("#scheduleTaskAlert").classList.remove(danger_alert_style);       // Style
              document.querySelector("#scheduleTaskAlert").classList.add(success_alert_style);

              document.querySelector("#scheduleTaskAlertText").innerHTML=`<i class="bi ${success_alert_icon}"></i> <strong>Job ${result_json["job_id"]} created</strong>`;
              document.querySelector("#scheduleTaskAlert").classList.remove("d-none");

              // Reload Datatable data
              $('#example').DataTable().ajax.reload();

            } else {
              // show banner red with output
              document.querySelector("#scheduleTaskAlert").classList.remove(success_alert_style);       // Style
              document.querySelector("#scheduleTaskAlert").classList.add(danger_alert_style);

              document.querySelector("#scheduleTaskAlertText").innerHTML=`<i class="bi ${danger_alert_icon}"></i> <strong>Job creation failed</strong><br> ${result_json["output"]}`;
              document.querySelector("#scheduleTaskAlert").classList.remove("d-none");
            }
        })
        .catch(function() {
            // An error occurred
        });
}

function deleteJob(job_id) {
    let data_to_send = {};
    data_to_send["csrfmiddlewaretoken"] = csrf_token;
    data_to_send["job_id"] = job_id;

    AJAX("/delete-job/", data_to_send, 'POST')
        .then(function(result) {
            // convert result to JSON
            let result_json = JSON.parse(result)

            /* Inform about deleted task */
            if (result_json['status'] === 0) {
                // Reload Datatable data
                $('#example').DataTable().ajax.reload();

                // Close confirmation modal
                var myModalEl = document.getElementById('ModalDeletion');
                var modal = bootstrap.Modal.getInstance(myModalEl)
                modal.hide();

            } else {
                // show banner red with output
                document.querySelector("#deletionTaskAlert").classList.remove(success_alert_style);       // Style
                document.querySelector("#deletionTaskAlert").classList.add(danger_alert_style);

                document.querySelector("#deletionTaskAlertText").innerHTML=`<i class="bi ${danger_alert_icon}"></i> <strong>Job deletion failed</strong><br> ${result_json["error"]}`;
                document.querySelector("#deletionTaskAlert").classList.remove("d-none");

            }
        })
        .catch(function() {
            // An error occurred
        });
}

function resetDB() {
    let data_to_send = {};
    data_to_send["csrfmiddlewaretoken"] = csrf_token;

    AJAX("/reset-db/", data_to_send, 'POST')
        .then(function(result) {
            // convert result to JSON
            let result_json = JSON.parse(result)

            /* Inform about deleted task */
            if (result_json['status'] === 0) {
                // Reload Datatable data
                $('#example').DataTable().ajax.reload();

                // Close confirmation modal
                var myModalEl = document.getElementById('ModalDeletion');
                var modal = bootstrap.Modal.getInstance(myModalEl)
                modal.hide();

            } else {
                // show banner red with output
                document.querySelector("#deletionTaskAlert").classList.remove(success_alert_style);       // Style
                document.querySelector("#deletionTaskAlert").classList.add(danger_alert_style);

                document.querySelector("#deletionTaskAlertText").innerHTML=`<i class="bi ${danger_alert_icon}"></i> <strong>Reset DB failed</strong><br> ${result_json["error"]}`;
                document.querySelector("#deletionTaskAlert").classList.remove("d-none");
            }
        })
        .catch(function() {
            // An error occurred
        });
}

function modalResetDB() {
    document.querySelector("#deletionTaskAlert").classList.add("d-none");
    document.querySelector('#modalDeleteConfirmBtn').setAttribute('onclick', 'resetDB()');
    document.querySelector('#ModalDeletionLabel').innerHTML='<span class="bi bi-exclamation-square-fill" style="color: red; font-size: 2rem;"></span>&nbsp; Reset Database';
    document.querySelector('#modalDeleteConfirmBody').innerHTML='Are you sure you want to reset the database ? <br> The history will be lost and only jobs scheduled will be shown';
}

function modalDelete(row_job_id) {
    document.querySelector("#deletionTaskAlert").classList.add("d-none");
    document.querySelector('#modalDeleteConfirmBtn').setAttribute('onclick', `deleteJob(${row_job_id});`);
    document.querySelector('#modalDeleteConfirmBody').innerHTML=`Are you sure you want to delete Job ${row_job_id} ?`;
    document.querySelector('#ModalDeletionLabel').innerHTML='<span class="bi bi-exclamation-square-fill" style="color: red; font-size: 2rem;"></span>&nbsp; Job deletion';
}

// Listeners' functions
function displayDateTimeField() {
    if (document.querySelector('input[name=dateTimeMode]:checked').id == "radioDateTime") {
        document.querySelector('#relativeTime').classList.add("d-none");
        document.querySelector('#datetimeSchedule').classList.remove("d-none");
    } else if (document.querySelector('input[name=dateTimeMode]:checked').id == "radioRelativeTimes") {
        document.querySelector('#datetimeSchedule').classList.add("d-none");
        document.querySelector('#relativeTime').classList.remove("d-none");
    }
}

/* Listeners */
document.querySelectorAll('input[name=dateTimeMode]').forEach(el => el.addEventListener(
    'change', displayDateTimeField, false
));

window.addEventListener('load', (event) => {
    displayDateTimeField();
});

window.addEventListener('load', (event) => {
    document.querySelector('.select-items').addEventListener('click', function (event) {
            if (select_last_value != getSelectedValue()) {
                // to something
                datatableFilterStatus(this);

                // assign the new value to the history (last value)
                select_last_value = getSelectedValue();
            }
    });
});

// TODO:
// 3. RuntimeWarning: DateTimeField Jobs.schedule_datetime received a naive datetime (2024-07-09 19:41:00) while time zone support is active.