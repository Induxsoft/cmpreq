var consolidados =
{
    form: {
        url_get_fultimo:"", url_exit:"",

        init()
        {
            const btn_get_folio = document.getElementById("btn_get_folio");
            const sel_divisa = document.getElementById("sel_divisa");
            
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
        tableReqId:"", tableReq:null,
        tableProdId:"", tableProd:null,
        url_get_productos:"", url_exit:"",

        init()
        {
            this.form = document.getElementById(this.formId);
            this.tableReq = document.getElementById(this.tableReqId);
            this.tableProd = document.getElementById(this.tableProdId);
            const btn_submit = document.getElementById("btn_submit");
            const btn_add_req = document.getElementById("btn-add-req");
            const btn_rem_req = document.getElementById("btn-rem-req");
            const ik_requisicion = document.getElementById("ik_requisicion");

            btn_submit.addEventListener("click", () => { this.save() });
            btn_add_req.addEventListener("click", () => { ik_requisicion.searchText("",false) });
            btn_rem_req.addEventListener("click", () => { this.removerRequisicion() });
            ik_requisicion.addEventListener("change", (data) => { this.agregarRequisicion(data) });

            this.setKeyboardShortcuts();
            this.setEventTables();
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

        setEventTables()
        {
            
        },

        save()
        {
            if (!this.form.reportValidity()) return;

            const txt_requisiciones = document.getElementById("txt_requisiciones");
            let table = this.tableReq;
            let array = table?.DataArray??[];
            let _reqsId = [];

            for (let i = 0; i < array.length; i++) {
                const obj = array[i];
                
                if (Object.entries(obj??{}).length < table.Columns.length) continue;
                if (_reqsId.includes(obj.sys_pk)) continue;
                _reqsId.push(obj.sys_pk);
            }
            
            txt_requisiciones.value = _reqsId.join(",");
            
            // trigger(this.form,"submit")
        },

        cleanDataArray(edt) {
            if (!edt) return [];
            return (edt?.DataArray??[]).filter((row) => { return Object.entries(row??{}).length >= edt.Columns.length })
        },

        agregarRequisicion(data)
        {
            let table = this.tableReq;
            if (!data) return;
            if (!table) return;

            let _requisiciones = this.cleanDataArray(table);
            let available_row =(_requisiciones.length > 0) ? _requisiciones.length : 0;

            if (table.DataArray.length === _requisiciones.length) table.AddRow();

            table.DataArray[available_row] = data;
            table.UpdateRow(available_row);
            this.sumarTotales();
            this.obtenerProductos(data.sys_pk);
        },

        removerRequisicion()
        {
            this.tableReq.DeleteCurrentRow();
            this.sumarTotales();
        },

        agregarProducto(data)
        {
            let table = this.tableProd;
            if (!data) return;
            if (!table) return;

            let _productos = this.cleanDataArray(table);
            let available_row =(_productos.length > 0) ? _productos.length : 0;

            if (table.DataArray.length === _productos.length) table.AddRow();

            table.DataArray[available_row] = data;
            table.UpdateRow(available_row);
        },

        removerProducto()
        {
            
        },

        obtenerProductos(cmpreqId)
        {
            let url = this.url_get_productos.replace("{ireq}",cmpreqId);

            fetch(url).then(response => response.json())
            .then(data => {
                if (data.message) {
                    alert(data.message);
                    return;
                }

                (data??[]).forEach(prod => {
                    this.agregarProducto(prod);
                });
            })
            .catch(error => console.error(error));
        },

        sumarTotales()
        {
            let table = this.tableReq;
            if (!table) return;

            const lbl_subtotal = document.getElementById("lbl_subtotal");
            const lbl_impuesto = document.getElementById("lbl_impuesto");
            const lbl_importe = document.getElementById("lbl_importe");
            const txt_divisa = document.getElementById("txt_divisa");

            let lcode = (new Intl.NumberFormat()).resolvedOptions().locale;
            let divisa = txt_divisa.getAttribute("data-codigo").toUpperCase();
            let array = table?.DataArray ?? [];
    
            let subtotal = 0, descuento = 0, impuesto = 0, importe = 0;
    
            for (let i = 0; i < array.length; i++) {
                const row = array[i];
                if (Object.entries(row??{}).length < table.Columns.length) continue;
                
                subtotal += Number(row.subtotal);
                descuento += Number(row.descuentos);
                impuesto += Number(row.impuestos);
                importe += Number(row.importe);
            }

            const formatter = new Intl.NumberFormat(lcode, {
                style: "currency",
                currency: divisa,
                minimumFractionDigits: 4,
                maximumFractionDigits: 4
            });
    
            lbl_subtotal.textContent = formatter.format(subtotal);
            lbl_impuesto.textContent = formatter.format(impuesto);
            lbl_importe.textContent = formatter.format(importe);
        },
    }
}