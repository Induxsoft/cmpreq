var requisiciones =
{
    list: {
        tableId:"",
        table:null,

        init()
        {
            this.table = document.getElementById(this.tableId);

            this.setKeyboardShortcuts();
        },

        setKeyboardShortcuts()
        {
            document.addEventListener("keydown", (e) => {
                // console.log("key: "+ e.key + " | " + "code: " + e.code);
                if (e.key === "Escape") {
                    e.preventDefault();
                    window.open("/","_top");
                }
                if (e.key === "F5") {
                    e.preventDefault();
                    window.location.reload();
                }
            });
        },

        getCurrentContext()
        {
            const id = (this.table?.DataArray[this.table.CurrentRowIndex()]?.sys_pk ?? "");
            return { item_id:id, context: {} }
        },
    },

    form: {
        url_get_fultimo:"",

        init()
        {
            const sel_ejercicio = document.getElementById("sel_ejercicio");
            const ik_partida_pre = document.getElementById("ik_partida_pre");
            const btn_get_folio = document.getElementById("btn_get_folio");
            const sel_divisa = document.getElementById("sel_divisa");

            if (sel_ejercicio) sel_ejercicio.addEventListener("change", () => { ik_partida_pre.clear() });
            if (ik_partida_pre) ik_partida_pre.onBeforeSearch = (url) => { return this.prepareIkPartida(url) };
            if (btn_get_folio) btn_get_folio.addEventListener("click", () => { this.getFolio() });
            if (sel_divisa) sel_divisa.addEventListener("change", (event) => { this.setTipoCambio(event.target) });

            this.setKeyboardShortcuts();

            trigger(sel_divisa,"change");
        },

        setKeyboardShortcuts()
        {
            document.addEventListener("keydown", (e) => {
                // console.log("key: "+ e.key + " | " + "code: " + e.code);
                if (e.key === "Escape") {
                    e.preventDefault();
                    window.open("/","_top");
                }
                if (e.key === "F5") {
                    e.preventDefault();
                    window.location.reload();
                }
            });
        },

        prepareIkPartida(url)
        {
            const ik_unidad_org = document.getElementById("ik_unidad_org");
            const sel_ejercicio = document.getElementById("sel_ejercicio");

            let unidad = ik_unidad_org.getValue();
            let ejercicio = sel_ejercicio.value;

            let endpoint = url + "&iunidad="+unidad.sys_pk + "&ejercicio="+ejercicio;

            return endpoint;
        },

        getFolio()
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

        setTipoCambio(selDivisa)
        {
            const opt_divisa = selDivisa.options[selDivisa.selectedIndex];
            const txt_tcambio = document.getElementById("txt_tcambio");
            
            txt_tcambio.value = Number(opt_divisa.getAttribute("data-tcambio") ?? "1");
        },
    },

    edit: {
        formId:"", form:null,
        tableId:"", table:null,

        init()
        {
            this.setKeyboardShortcuts();
        },

        setKeyboardShortcuts()
        {
            document.addEventListener("keydown", (e) => {
                // console.log("key: "+ e.key + " | " + "code: " + e.code);
                if (e.key === "Escape") {
                    e.preventDefault();
                    window.open("/","_top");
                }
                if (e.key === "F5") {
                    e.preventDefault();
                    window.location.reload();
                }
            });
        },
    }
}