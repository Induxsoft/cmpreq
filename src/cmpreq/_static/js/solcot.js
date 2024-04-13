var solcot =
{
    url_exit:"", url_get_fultimo:"", url_solcot:"",
    formId:"", form:null,
    tableId:"", table:null,

    init()
    {
        const btn_get_folio = document.getElementById("btn_get_folio");
        const btn_add_solcot = document.getElementById("btn-add-solcot");
        const btn_edt_solcot = document.getElementById("btn-edt-solcot");
        const btn_del_solcot = document.getElementById("btn-del-solcot");
        const btn_submit = document.getElementById("btn_submit");
        const btn_reset = document.getElementById("btn_reset")
        this.form = document.getElementById(this.formId);
        this.table = document.getElementById(this.tableId);

        btn_get_folio.addEventListener("click", () => this.getFUltimo());
        btn_edt_solcot.addEventListener("click", () => this.editarSolicitud());
        btn_del_solcot.addEventListener("click", () => this.removerSolicitud());
        btn_submit.addEventListener("click", () => this.save());
        btn_reset.addEventListener("click", () => this.form.reset());

        this.setKeyboardShortcuts();
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

    cleanDataArray(edt) {
        if (!edt) return [];
        return (edt?.DataArray??[]).filter((row) => { return Object.entries(row??{}).length >= edt.Columns.length })
    },

    agregarSolicitud(data)
    {
        let table = this.table;
        if (!data) return;
        if (!table) return;

        let _solicitudes = this.cleanDataArray(table);
        let available_row =(_solicitudes.length > 0) ? _solicitudes.length : 0;

        if (table.DataArray.length === _solicitudes.length) table.AddRow();

        table.DataArray[available_row] = data;
        table.UpdateRow(available_row);
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
        this.showModal("mdl_solcot");
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