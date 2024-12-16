// ==UserScript==
// @name         firePersonal-Faule Saecke
// @version      1.0.4
// @description  markiertes Personal entlassen und Checkboxen für nicht gebundenes Personal aktivieren
// @author       DrTraxx/MissSobol
// @include      /^https?:\/\/(w{3}\.)?(polizei\.)?leitstellenspiel\.de\/buildings\/.*\/personals/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=leitstellenspiel.de
// @grant        none
// ==/UserScript==
/* global $ */

(function () {
    'use strict';

    const arrFirePersonal = [],
        tablePersonalRows = $("#personal_table > tbody > tr");

    $("a[href*='hire']").after(`<a class="btn btn-xs btn-danger" id="fire_personal">ausgewähltes Personal entlassen</a>`);
    $("a[href*='hire']").after(`<a class="btn btn-xs btn-success" id="activate_checkboxes">Checkboxen aktivieren</a>`);

    $("#personal_table > thead > tr")
        .append(`<th data-column="4" class="tablesorter-header sorter-false tablesorter-headerUnSorted" tabindex="0" scope="col" role="columnheader" aria-disabled="true" unselectable="on" style="user-select: none;" aria-sort="none">
                   <div class="tablesorter-header-inner">entlassen</div>
                 </th>`);

    for (var i = 0; i < tablePersonalRows.length; i++) {
        const r = tablePersonalRows[i],
            personalNmbr = +$(r).children("td").children("div")[0].lastElementChild.attributes.href.value.replace(/\D+/g, "");

        $(r).append(`<td>
                       <input type="checkbox" class="form-check-input" id="check_${ personalNmbr }">
                     </td>`)
            .addClass("mark_personal")
            .attr("personal_number", personalNmbr)
            .css({ "cursor": "pointer" });
    }

    $("body").on("click", ".mark_personal", function () {
        const index = arrFirePersonal.indexOf(+$(this).attr("personal_number"));
        if (index === -1) {
            arrFirePersonal.push(+$(this).attr("personal_number"));
            $(`#check_${ $(this).attr("personal_number") }`)[0].checked = true;
        } else {
            arrFirePersonal.splice(index, 1);
            $(`#check_${ $(this).attr("personal_number") }`)[0].checked = false;
        }
    });

    $("#activate_checkboxes").on("click", function () {
        $(".mark_personal").each(function () {
            const tdText = $(this).closest("tr").find("td:nth-child(3)").text().trim();
            if (tdText === "") {
                const personalNumber = $(this).attr("personal_number");
                $(`#check_${ personalNumber }`)[0].checked = true;
                if (arrFirePersonal.indexOf(+personalNumber) === -1) {
                    arrFirePersonal.push(+personalNumber);
                }
            }
        });
    });

    $("#fire_personal").on("click", async function () {
        if (arrFirePersonal.length === 0) {
            alert("Du musst Personal zum Entlassen auswählen!");
            return;
        }
        if (confirm(`Willst du die ${ arrFirePersonal.length } Muggel wirklich entlassen?`) === true) {
            for (var p in arrFirePersonal) {
                const armeSau = arrFirePersonal[p];
                $("#fire_personal").text(`Entlasse Mitarbeiter ${ +p + 1 } von ${ arrFirePersonal.length }!`);
                await $.post(`/personals/${ armeSau }`, { "_method": "delete", "authenticity_token": $("meta[name=csrf-token]").attr("content") });
            }
            window.location.reload();
        }
    });

})();
