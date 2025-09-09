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
        tblReqId:"", tableReq:null,
        tblProdId:"", tableProd:null,
        fullProdArray: [],
        url_change_status:"", url_get_productos:"", url_solcot:"", url_exit:"",

        init()
        {
            this.form = document.getElementById(this.formId);
            this.tableReq = document.getElementById(this.tblReqId);
            this.tableProd = document.getElementById(this.tblProdId);
            const btn_submit = document.getElementById("btn_submit");
            const btn_add_req = document.getElementById("btn-add-req");
            const btn_rem_req = document.getElementById("btn-rem-req");
            const ik_requisicion = document.getElementById("ik_requisicion");

            if (btn_submit) btn_submit.addEventListener("click", () => { this.save() });
            btn_add_req.addEventListener("click", () => { ik_requisicion.searchText("",false) });
            btn_rem_req.addEventListener("click", () => { this.removerRequisicion() });
            ik_requisicion.addEventListener("change", (data) => { this.agregarRequisicion(data) });

            this.setKeyboardShortcuts();
            this.setEventBtnStatus();
            this.sumarTotales();
            this.agregarProductos();
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

        save()
        {
            if (!this.form.reportValidity()) return;

            const txt_requisiciones = document.getElementById("txt_requisiciones");
            const txt_detalle = document.getElementById("txt_detalle");
            
            let _detalle = this.cleanDataArray(this.tableReq);
            let _reqsId = [];

            for (let i = 0; i < _detalle.length; i++) {
                const data = _detalle[i];
                
                if (_reqsId.includes(data.sys_pk)) continue;
                _reqsId.push(data.sys_pk);
            }
            
            txt_requisiciones.value = _reqsId.join(",");
            txt_detalle.value = JSON.stringify(_detalle);
            
            this.form.submit();
        },

        changeStatus(status)
        {
            if (!this.url_change_status) return;

            let fd = new FormData(this.form);
            fd.append("status",status);
            let endpoint = this.url_change_status.replace("{ireq}",fd.get("sys_pk"));

            const onSuccess = (data) =>
            {
                if (data.message) {
                    alert(data.message);
                    return;
                }

                if (data.status === 20 && this.url_solcot) window.location.href = path_concat(this.url_solcot, data.sys_pk, "/cmp-in-process/");
                else window.location.reload();
            }
            const onFailure = (error) => { alert(error.message ?? JSON.stringify(error)) }

            InduxsoftCrudlModel.InvokeService(endpoint,fd,onSuccess,onFailure,"PATCH",false,true,"",true);
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
            if (!this.validarRequisicion(data)) return;

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
            if (!this.tableReq) return;

            let table = this.tableReq;
            let array = table?.DataArray ?? [];
            let curr_row = table.CurrentRowIndex();
            let curr_obj = array[curr_row] ?? {};

            if (curr_row < 0) return;
            if (!table.DeleteRow(curr_row)) return;

            this.sumarTotales();
            this.removerProductos(curr_obj.sys_pk);
        },

        agregarProducto(data)
        {
            if (!data) return;
            if (!this.tableProd) return;

            let table = this.tableProd;
            let array = table?.DataArray ?? [];
            this.fullProdArray.push(data);

            let index = array.findIndex(obj => obj.sys_pk === data.sys_pk && obj.precio === data.precio);
            if(index < 0)
            {
                let _productos = this.cleanDataArray(table);
                let available_row = (_productos.length > 0) ? _productos.length : 0;

                if (array.length === _productos.length) table.AddRow();
                
                table.DataArray[available_row] = data;
                table.UpdateRow(available_row);   
            }
            else
            {
                array[index]["cantidad"] += data.cantidad;
                array[index]["subtotal"] += data.subtotal;
                array[index]["impuestos"] += data.impuestos;
                array[index]["importe"] += data.importe;

                table.UpdateRow(index);
            }
        },

        removerProducto(index, data=null)
        {
            if (index < 0) return;
            if (!this.tableProd) return;

            let table = this.tableProd;
            let array = table?.DataArray ?? [];

            if (!data) table.DeleteRow(index);
            else
            {
                array[index]["cantidad"] -= data.cantidad;
                array[index]["subtotal"] -= data.subtotal;
                array[index]["impuestos"] -= data.impuestos;
                array[index]["importe"] -= data.importe;

                if (array[index]["cantidad"] <= 0) table.DeleteRow(index);
                else table.UpdateRow(index);

                let idx = this.fullProdArray.findIndex(obj => obj.sys_pk === data.sys_pk && obj.precio === data.precio && obj.ref_req === data.ref_req);
                if (idx >= 0) this.fullProdArray.splice(idx,1);
            }
        },

        agregarProductos()
        {
            if (!this.tableReq) return;

            let table = this.tableReq;
            let array = table?.DataArray ?? [];

            for (let i = 0; i < array.length; i++) {
                const obj = array[i];
                if (Object.entries(obj??{}).length < table.Columns.length) continue;
                if (!obj.sys_pk) continue;

                this.obtenerProductos(obj.sys_pk);
            }
        },

        removerProductos(cmpreqId)
        {
            if (!cmpreqId) return;

            let table = this.tableProd;
            let array = table?.DataArray ?? [];

            let _productos = this.fullProdArray.filter(obj => obj.ref_req === cmpreqId);
            for (let i = 0; i < _productos.length; i++) {
                const data = _productos[i];
                
                let index = array.findIndex(obj => obj.sys_pk === data.sys_pk && obj.precio === data.precio);
                this.removerProducto(index,data);
            }
            
            console.log(this.fullProdArray);
        },

        async obtenerProductos(cmpreqId)
        {
            if (!cmpreqId) return;
            if (!this.url_get_productos) return;

            let url = this.url_get_productos.replace("{ireq}",cmpreqId);

            try {
                const response = await fetch(url);
                const data = await response.json();

                if (data.message) {
                    alert(data.message);
                    return;
                }

                (data??[]).forEach(prod => {
                    this.agregarProducto(prod);
                });
            } catch (error) {
                console.error(error)
            }

            /* fetch(url).then(response => response.json())
            .then(data => {
                if (data.message) {
                    alert(data.message);
                    return;
                }

                (data??[]).forEach(prod => {
                    this.agregarProducto(prod);
                });
            })
            .catch(error => console.error(error)); */
        },

        validarRequisicion(data)
        {
            const txt_divisa = document.getElementById("txt_divisa");
            if (data.cdivisa !== txt_divisa.getAttribute("data-codigo").toUpperCase()) {
                alert("No es posible agregar la requisición por la diferencia de divisas.");
                return false;
            }

            let table = this.tableReq;
            let array = table?.DataArray ?? [];
            let found = array.find(obj => obj.sys_pk === data.sys_pk);
            if (found) return false;

            return true;
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