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
            if (ik_partida_pre) ik_partida_pre.onBeforeSearch = (url) => { return this.prepareIkPartida(url) }
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
        zimpuesto:"",

        init()
        {
            const btn_submit = document.getElementById("btn_submit");
            const ik_producto = document.getElementById("ik_producto");
            this.form = document.getElementById(this.formId);
            this.table = document.getElementById(this.tableId);

            btn_submit.addEventListener("click", () => { trigger(this.form,"submit") });
            ik_producto.onBeforeSearch = (url) => { return this.prepareIkProducto(url) }
            ik_producto.addEventListener("change",(data) => { this.addProducto(data) });

            this.table.setInputKey("edt_codigo",ik_producto);
            this.table.setInputKey("edt_descripcion",ik_producto);
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

        prepareIkProducto(url)
        {
            let zimpuesto = (this.zimpuesto > 1) ? -1 : 1;
            return url.replace("@zimpuesto",zimpuesto);
        },

        addProducto(p)
        {
            if (!p) return;

            let tData = this.table.DataArray ?? [];
            let curr_row = this.table.CurrentRowIndex();
            let i = this.calcularImpuestos(p);
            let lu = this.joinUnidades(p.unidada,p.unidadb,p.unidadc,p.unidadd,p.unidade);
            
            let producto = 
            {
                // campos visibles en el editable.
                edt_codigo: p.codigo,
                edt_descripcion: p.descripcion,
                edt_unidad: p.unidada,
                edt_precio: i.costo,
                edt_cantidad: i.cantidad,
                edt_subtotal: i.subtotal,
                edt_descuentos: i.descuentos,
                edt_impuestos: i.impuestos,
                edt_importe: i.total,
                edt_notas: "",

                // campos para el insert.
                cantidad: i.cantidad,
                costototal: i.costo,
                descuento1: i.descuentos,
                descuento2: 0,
                factor: 1,
                impuesto1: i.impuesto1,
                impuesto2: i.impuesto2,
                impuesto3: i.impuesto3,
                impuesto4: i.impuesto4,
                notas: "",
                precio: i.costo,
                status: 1, // cPor_recibir
                tipocambio: p.tipocambio,
                unidad: p.unidada,
                xfacturar: 1.0,
                iproducto: p.sys_pk,
                doc_partida: (p.doc_partida??null),
                documento: (p.documento??null),

                // campos extras para operaciones.
                subtotal: i.subtotal,
                descuentos: i.descuentos,
                impuestos: i.impuestos,
                importe: i.total,
                i1_tasa: p.i1_tasa,
                i2_tasa: p.i2_tasa,
                i3_tasa: p.i3_tasa,
                i4_tasa: p.i4_tasa,
                unidada: p.unidada,
                unidadb: p.unidadb,
                unidadc: p.unidadc,
                unidadd: p.unidadd,
                unidade: p.unidade,
                factorb: p.factorb,
                factorc: p.factorc,
                factord: p.factord,
                factore: p.factore,
                lunidades: lu,
                reqlote: p.reqlote,
                reqserie: p.reqserie,
                doc_partida: (p.doc_partida??null),
                pendientes: p.pendientes,
                minimo: (p.minimo??0),
                usado: (p.minimo??0),
                cantidad_constante: (p.cantidad_constante??0)
            }

            if (curr_row < 0) curr_row = 0;
            if (!tData[curr_row]) tData[curr_row] = {};
            tData[curr_row] = producto
            this.table.UpdateRow(curr_row);
            this.table.NavTo(curr_row,2);
            this.sumarImportes();
        },

        joinUnidades(...unidades) {
            let obj = {};
    
            for (let i = 0; i < unidades.length; i++) {
                const u = unidades[i];
                if (typeof u === "string" && u.trim() != "")
                    obj[u] = u;
            }
    
            return JSON.stringify(obj);
        },

        calcularImpuestos(prod)
        {
            let costo = Number(prod.precio);
            let cantidad = Number(prod.cantidad);
            let descuentos = Number(prod.descuentos);
            let i1_tasa = Number(prod.i1_tasa);
            let i2_tasa = Number(prod.i2_tasa);
            let i3_tasa = Number(prod.i3_tasa);
            let i4_tasa = Number(prod.i4_tasa);
    
            let subtotal = Math.mul(costo,cantidad);
            let sub_desc = Math.sub(subtotal,descuentos);
            let impuesto1 = Math.mul(sub_desc,i1_tasa);
            let impuesto2 = Math.mul(sub_desc,i2_tasa);
            let i1_i2 = Math.add(impuesto1,impuesto2);
            let sub_desc_i1_i2 = Math.add(sub_desc,i1_i2);
            let impuesto3 = Math.mul(sub_desc_i1_i2,i3_tasa);
            let impuesto4 = Math.mul(sub_desc_i1_i2,i4_tasa);
            let i3_i4 = Math.add(impuesto3,impuesto4);
            let impuestos = Math.add(i1_i2,i3_i4);
            let total = Math.add(sub_desc,impuestos);
    
            let importes = {
                costo: costo,
                cantidad: cantidad,
                subtotal: subtotal,
                descuentos: descuentos,
                impuestos: impuestos,
                total: total,
                impuesto1: impuesto1,
                impuesto2: impuesto2,
                impuesto3: impuesto3,
                impuesto4: impuesto4,
            }
    
            return importes;
        },

        sumarImportes()
        {
            const lbl_subtotal = document.getElementById("lbl_subtotal");
            const lbl_impuesto = document.getElementById("lbl_impuesto");
            const lbl_importe = document.getElementById("lbl_importe");
            const txt_divisa = document.getElementById("txt_divisa");

            let lcode = (new Intl.NumberFormat()).resolvedOptions().locale;
            let divisa = txt_divisa.getAttribute("data-codigo").toUpperCase();
            let tData = this.table.DataArray ?? [];
    
            let subtotal = 0, descuento = 0, impuesto = 0, importe = 0;
    
            for (let i = 0; i < tData.length; i++) {
                const producto = tData[i];
                if (Object.entries(producto ?? {}).length === 0) continue;
                
                subtotal += Number(producto.subtotal);
                descuento += Number(producto.descuentos);
                impuesto += Number(producto.impuestos);
                importe += Number(producto.importe);
            }

            const formatter = new Intl.NumberFormat(lcode,{
                style: "currency",
                currency: divisa,
                minimumFractionDigits: 4,
                maximumFractionDigits: 4
            });
    
            lbl_subtotal.textContent = formatter.format(subtotal);
            lbl_impuesto.textContent = formatter.format(impuesto);
            lbl_importe.textContent = formatter.format(importe);
        }
    }
}