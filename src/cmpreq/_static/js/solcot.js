var solcot =
{
    url_exit:"", url_get_fultimo:"", url_solcot:"", url_change_status:"", url_add_cotizacion:"", url_del_cotizacion:"", url_can_solicitud:"",
    formId:"", form:null,
    tableId:"", table:null,

    init()
    {
        const btn_get_folio = document.getElementById("btn_get_folio");
        const btn_add_cot = document.getElementById("btn-add-cot");
        const btn_del_cot = document.getElementById("btn-del-cot");
        const btn_add_solcot = document.getElementById("btn-add-solcot");
        const btn_edt_solcot = document.getElementById("btn-edt-solcot");
        const btn_can_solcot = document.getElementById("btn-can-solcot");
        const btn_submit = document.getElementById("btn_submit");
        const btn_reset = document.getElementById("btn_reset")
        const mdl_solcot = document.getElementById("mdl_solcot");
        const ik_cotizacion = document.getElementById("ik_cotizacion");
        this.form = document.getElementById(this.formId);
        this.table = document.getElementById(this.tableId);

        btn_get_folio.addEventListener("click", () => this.getFUltimo());
        btn_add_cot.addEventListener("click", () => this.prepareIkCotizacion());
        btn_del_cot.addEventListener("click", () => this.removerCotizacion());
        btn_add_solcot.addEventListener("click", () => {
            disableControls(["sel_serie","txt_folio","btn_get_folio","ik_proveedor"],false);
            this.showModal("mdl_solcot");
        });
        btn_edt_solcot.addEventListener("click", () => this.editarSolicitud());
        btn_can_solcot.addEventListener("click", () => this.cancelarSolicitud());
        btn_submit.addEventListener("click", () => this.save());
        mdl_solcot.addEventListener("hide.bs.modal", () => this.form.reset());
        ik_cotizacion.addEventListener("change", (data) => this.agregarCotizacion(data));

        this.setKeyboardShortcuts();
        this.setEventBtnStatus();
    },

    setKeyboardShortcuts()
    {
        document.addEventListener("keydown", (e) => {
            // console.log("key: "+ e.key + " | " + "code: " + e.code);
            if (e.key === "Escape") {
                e.preventDefault();
                (this.url_exit !== "")
                    ? window.location.href = this.url_exit
                    : window.open("/","_top"); 
            }
            if (e.key === "F5") {
                e.preventDefault();
                window.location.reload();
            }
        });
    },

    setEventBtnStatus()
    {
        const buttons = document.querySelectorAll(".btn-status");
        buttons.forEach(btn => {
            let status = Number(btn.getAttribute("data-status"));
            btn.addEventListener("click", () => { this.changeStatus(status) });
        });
    },

    prepareIkCotizacion()
    {
        if (!this.table) return;

        let curr_row = this.table.CurrentRowIndex();
        let array = this.table?.DataArray ?? [];
        let curr_obj = array[curr_row] ?? {};

        if (curr_row < 0) return;
        if (Object.entries(curr_obj).length < this.table.Columns.length) return;

        const ik_cotizacion = document.getElementById("ik_cotizacion");
        ik_cotizacion.setAttribute("data-source", ik_cotizacion.getAttribute("data-source")+"&iproveedor="+curr_obj.iproveedor);

        ik_cotizacion.searchText("",false);
    },

    getFUltimo()
    {
        const sel_serie = document.getElementById("sel_serie");
        const opt_serie = sel_serie.options[sel_serie.selectedIndex];
        const txt_folio = document.getElementById("txt_folio");
        
        let iblock = Number(opt_serie.getAttribute("data-iblock"));
        let url = this.url_get_fultimo.replace("{iblock}",iblock);

        if (Number(txt_folio.value) > 0) return;

        fetch(url).then(response => response.json())
        .then(data => {
            if (data.message) {
                alert(data.message);
                return;
            }

            txt_folio.value = data.fultimo;
        })
        .catch(error => console.error(error));
    },

    save()
    {
        if (!this.form) return;
        if (!this.url_solcot) return;

        let fd = new FormData(this.form);
        let _entity_id = (Number(fd.get("sys_pk")) <= 0) ? "_new" : fd.get("sys_pk");
        let endpoint = this.url_solcot + _entity_id + "/";
        let method = (_entity_id === "_new") ? "POST" : "PATCH";

        const onSuccess = (data) =>
        {
            if (data.message) {
                alert(data.message);
                return;
            }

            const ik_proveedor = document.getElementById("ik_proveedor");

            this.agregarSolicitud(data);
            this.form.reset();
            ik_proveedor.clear();
            this.closeModal("mdl_solcot");
        }

        const onFailure = (error) => { alert(error.message ?? JSON.stringify(error)) }

        InduxsoftCrudlModel.InvokeService(endpoint,fd,onSuccess,onFailure,method,false,true,"",true);
    },

    agregarCotizacion(doc)
    {
        if (!doc) return;
        if (!this.url_add_cotizacion) return;

        let curr_row = this.table.CurrentRowIndex();
        let curr_obj = this.table.DataArray[curr_row];

        let fd = new FormData();
        fd.append("sys_pk",curr_obj.sys_pk);
        fd.append("sys_recver",curr_obj.sys_recver);
        fd.append("cotizacion",doc.sys_pk);
        let endpoint = this.url_add_cotizacion.replace("{isol}",curr_obj.sys_pk);

        const onSuccess = (data) =>
        {
            if (data.message) {
                alert(data.message);
                return;
            }

            curr_obj["sys_recver"] = data.sys_recver;
            curr_obj["icotizacion"] = data.icotizacion;
            curr_obj["cotizacion"] = data.cotizacion;
            curr_obj["fcotizacion"] = data.fcotizacion;
            curr_obj["ttl_cot"] = data.ttl_cot;
            
            this.table.UpdateRow(curr_row);
        }
        const onFailure = (error) => { alert(error.message ?? JSON.stringify(error)) }

        InduxsoftCrudlModel.InvokeService(endpoint,fd,onSuccess,onFailure,"PATCH",false,true,"",true);
    },

    removerCotizacion()
    {
        if (!this.table) return;
        if (!this.url_del_cotizacion) return;

        let curr_row = this.table.CurrentRowIndex();
        let array = this.table?.DataArray ?? [];
        let curr_obj = array[curr_row] ?? {};

        if (curr_row < 0) return;
        if (Object.entries(curr_obj).length < this.table.Columns.length) return;
        if (!curr_obj.cotizacion) return;
        if (!confirm("¿Desea remover la cotización de la solicitud seleccionada?")) return;

        let endpoint = this.url_del_cotizacion.replace("{isol}",curr_obj.sys_pk);

        const onSuccess = (data) =>
        {
            if (data.message) {
                alert(data.message);
                return;
            }

            curr_obj["sys_recver"] = data.sys_recver;
            curr_obj["icotizacion"] = 0;
            curr_obj["cotizacion"] = "";
            curr_obj["fcotizacion"] = "";
            curr_obj["ttl_cot"] = 0;
            
            this.table.UpdateRow(curr_row);
        }
        const onFailure = (error) => { alert(error.message ?? JSON.stringify(error)) }

        InduxsoftCrudlModel.InvokeService(endpoint,null,onSuccess,onFailure,"PATCH",false,true);
    },

    changeStatus(status)
    {
        if (!this.url_change_status) return;

        const cmpreqForm = document.getElementById("form-cmpreq");
        let fd = new FormData(cmpreqForm);
        let endpoint = this.url_change_status.replace("{ireq}",fd.get("sys_pk"));
        fd.append("status",status);

        const onSuccess = (data) =>
        {
            if (data.message) {
                alert(data.message);
                return;
            }

            window.location.reload();
        }
        const onFailure = (error) => { alert(error.message ?? JSON.stringify(error)) }

        InduxsoftCrudlModel.InvokeService(endpoint,fd,onSuccess,onFailure,"PATCH",false,true,"",true);
    },

    cleanDataArray(edt) {
        if (!edt) return [];
        return (edt?.DataArray??[]).filter((row) => { return Object.entries(row??{}).length >= edt.Columns.length })
    },

    agregarSolicitud(data)
    {
        let table = this.table;
        if (!data) return;
        if (!table) return;

        if (Number(data.sys_recver) === 0)
        {
            let _solicitudes = this.cleanDataArray(table);
            let available_row = (_solicitudes.length > 0) ? _solicitudes.length : 0;

            if (table.DataArray.length === _solicitudes.length) table.AddRow();

            table.DataArray[available_row] = data;
            table.UpdateRow(available_row);
        }
        else
        {
            let curr_row = table.CurrentRowIndex();
            table.DataArray[curr_row] = data;
            table.UpdateRow(curr_row);
        }
    },

    editarSolicitud()
    {
        let table = this.table;
        if (!this.table) return;
        
        let array = table?.DataArray ?? [];
        let curr_row = table.CurrentRowIndex();
        let curr_obj = array[curr_row] ?? {};

        if (curr_row < 0) return;
        if (Object.entries(curr_obj).length < table.Columns.length) return;

        this.fillFormData(curr_obj);
        disableControls(["sel_serie","txt_folio","btn_get_folio","ik_proveedor"]);
        this.showModal("mdl_solcot");
    },

    cancelarSolicitud()
    {
        if (!this.table) return;
        if (!this.url_can_solicitud) return;

        let curr_row = this.table.CurrentRowIndex();
        let array = this.table?.DataArray ?? [];
        let curr_obj = array[curr_row] ?? {};

        if (curr_row < 0) return;
        if (Object.entries(curr_obj).length < this.table.Columns.length) return;
        if (curr_obj.cancelada === "Si") return;
        if (!confirm("¿Desea cancelar la solicitud seleccionada?")) return;

        let endpoint = this.url_can_solicitud.replace("{isol}",curr_obj.sys_pk);
        let patchdata =
        {
            sys_pk: curr_obj.sys_pk,
            sys_recver: curr_obj.sys_recver
        }

        const onSuccess = (data) =>
        {
            if (data.message) {
                alert(data.message);
                return;
            }

            curr_obj["sys_recver"] = data.sys_recver;
            curr_obj["cancelada"] = data.cancelada;
            
            this.table.UpdateRow(curr_row);
        }
        const onFailure = (error) => { alert(error.message ?? JSON.stringify(error)) }

        InduxsoftCrudlModel.InvokeService(endpoint,patchdata,onSuccess,onFailure,"PATCH",false,true);
    },

    removerSolicitud()
    {
        let table = this.table;
        if (!this.table) return;
        
        let array = table?.DataArray ?? [];
        let curr_row = table.CurrentRowIndex();
        let curr_obj = array[curr_row] ?? {};

        if (curr_row < 0) return;
        if (!table.DeleteRow(curr_row)) return;
    },

    fillFormData(data)
    {
        if (!this.form) return;
        if (!data) return;

        let elements = this.form.elements;
        for (let i = 0; i < elements.length; i++) {
            const el = elements[i];
            if (el.name === "") continue;

            el.value = data[el.name];
        }
    },

    emptyFormData()
    {
        if (!this.form) return;

        let elements = this.form.elements;
        for (let i = 0; i < elements.length; i++) {
            const el = elements[i];
            if (el.name === "") continue;

            el.value = "";
        }
    },

    bsModal(id)
    {
        const modal = document.getElementById(id);
        let instance = bootstrap.Modal.getInstance(modal);
        if (!instance) instance = new bootstrap.Modal(modal);
        return instance;
    },
    showModal(id) { this.bsModal(id).show() },
    closeModal(id) { this.bsModal(id).hide() },
}