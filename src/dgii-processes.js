/**
 * Procesos oficiales simulados para la Dirección General de Impuestos Internos (DGII)
 * de la República Dominicana, modelados según los estándares BPMN 2.0 y aplicados
 * al contribuyente Nelson Miñoso.
 */

export const dgiiCertificacionXML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                  xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
                  id="Defs_DGII_Certificacion"
                  targetNamespace="http://dgii.gov.do/bpmn">
  <bpmn:collaboration id="Collab_Certificacion">
    <bpmn:participant id="Pool_DGII" name="DGII - Solicitud de Certificación Tributaria (Nelson Miñoso)" processRef="Process_Certificacion" />
  </bpmn:collaboration>

  <bpmn:process id="Process_Certificacion" isExecutable="false">
    <bpmn:laneSet id="LaneSet_DGII">
      <bpmn:lane id="Lane_Contribuyente" name="Contribuyente (Nelson Miñoso)">
        <bpmn:flowNodeRef>Start_Solicitud</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_IngresarOFV</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_DescargarCert</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>End_Exitoso</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>End_Denegado</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_DGII_Sistema" name="DGII - Oficina Virtual / Validación Automática">
        <bpmn:flowNodeRef>Task_ValidarRNC</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Gateway_Deuda</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_GenerarFirmaQR</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_NotificarDeuda</bpmn:flowNodeRef>
      </bpmn:lane>
    </bpmn:laneSet>

    <bpmn:startEvent id="Start_Solicitud" name="Nelson Miñoso requiere certificación">
      <bpmn:outgoing>Flow_1</bpmn:outgoing>
    </bpmn:startEvent>

    <bpmn:task id="Task_IngresarOFV" name="Completar formulario en Oficina Virtual">
      <bpmn:incoming>Flow_1</bpmn:incoming>
      <bpmn:outgoing>Flow_2</bpmn:outgoing>
    </bpmn:task>

    <bpmn:sequenceFlow id="Flow_1" sourceRef="Start_Solicitud" targetRef="Task_IngresarOFV" />

    <bpmn:task id="Task_ValidarRNC" name="Verificar estatus tributario y omisiones">
      <bpmn:incoming>Flow_2</bpmn:incoming>
      <bpmn:outgoing>Flow_3</bpmn:outgoing>
    </bpmn:task>

    <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_IngresarOFV" targetRef="Task_ValidarRNC" />

    <bpmn:exclusiveGateway id="Gateway_Deuda" name="¿Posee omisiones o deudas pendientes?">
      <bpmn:incoming>Flow_3</bpmn:incoming>
      <bpmn:outgoing>Flow_AlDia</bpmn:outgoing>
      <bpmn:outgoing>Flow_ConDeuda</bpmn:outgoing>
    </bpmn:exclusiveGateway>

    <bpmn:sequenceFlow id="Flow_3" sourceRef="Task_ValidarRNC" targetRef="Gateway_Deuda" />

    <bpmn:task id="Task_GenerarFirmaQR" name="Generar certificación con código QR y firma digital">
      <bpmn:incoming>Flow_AlDia</bpmn:incoming>
      <bpmn:outgoing>Flow_4</bpmn:outgoing>
    </bpmn:task>

    <bpmn:sequenceFlow id="Flow_AlDia" name="Al día (Sin deuda)" sourceRef="Gateway_Deuda" targetRef="Task_GenerarFirmaQR" />

    <bpmn:task id="Task_DescargarCert" name="Descargar documento oficial DGII">
      <bpmn:incoming>Flow_4</bpmn:incoming>
      <bpmn:outgoing>Flow_5</bpmn:outgoing>
    </bpmn:task>

    <bpmn:sequenceFlow id="Flow_4" sourceRef="Task_GenerarFirmaQR" targetRef="Task_DescargarCert" />

    <bpmn:endEvent id="End_Exitoso" name="Certificación emitida a Nelson Miñoso">
      <bpmn:incoming>Flow_5</bpmn:incoming>
    </bpmn:endEvent>

    <bpmn:sequenceFlow id="Flow_5" sourceRef="Task_DescargarCert" targetRef="End_Exitoso" />

    <bpmn:task id="Task_NotificarDeuda" name="Notificar requerimiento de regularización">
      <bpmn:incoming>Flow_ConDeuda</bpmn:incoming>
      <bpmn:outgoing>Flow_6</bpmn:outgoing>
    </bpmn:task>

    <bpmn:sequenceFlow id="Flow_ConDeuda" name="Con omisiones" sourceRef="Gateway_Deuda" targetRef="Task_NotificarDeuda" />

    <bpmn:endEvent id="End_Denegado" name="Trámite retenido por deuda">
      <bpmn:incoming>Flow_6</bpmn:incoming>
    </bpmn:endEvent>

    <bpmn:sequenceFlow id="Flow_6" sourceRef="Task_NotificarDeuda" targetRef="End_Denegado" />
  </bpmn:process>

  <bpmndi:BPMNDiagram id="BPMNDiagram_Cert">
    <bpmndi:BPMNPlane id="BPMNPlane_Cert" bpmnElement="Collab_Certificacion">
      <bpmndi:BPMNShape id="Pool_DGII_di" bpmnElement="Pool_DGII" isHorizontal="true">
        <dc:Bounds x="160" y="80" width="920" height="380" />
      </bpmndi:BPMNShape>
      
      <bpmndi:BPMNShape id="Lane_Contribuyente_di" bpmnElement="Lane_Contribuyente" isHorizontal="true">
        <dc:Bounds x="190" y="80" width="890" height="190" />
      </bpmndi:BPMNShape>
      
      <bpmndi:BPMNShape id="Lane_DGII_Sistema_di" bpmnElement="Lane_DGII_Sistema" isHorizontal="true">
        <dc:Bounds x="190" y="270" width="890" height="190" />
      </bpmndi:BPMNShape>

      <!-- Elementos Lane Contribuyente -->
      <bpmndi:BPMNShape id="Start_Solicitud_di" bpmnElement="Start_Solicitud">
        <dc:Bounds x="240" y="142" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="220" y="185" width="76" height="40" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="Task_IngresarOFV_di" bpmnElement="Task_IngresarOFV">
        <dc:Bounds x="330" y="120" width="130" height="80" />
      </bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="Task_DescargarCert_di" bpmnElement="Task_DescargarCert">
        <dc:Bounds x="830" y="120" width="130" height="80" />
      </bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="End_Exitoso_di" bpmnElement="End_Exitoso">
        <dc:Bounds x="1000" y="142" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="980" y="185" width="76" height="40" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="End_Denegado_di" bpmnElement="End_Denegado">
        <dc:Bounds x="1000" y="210" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="980" y="253" width="76" height="27" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>

      <!-- Elementos Lane Sistema DGII -->
      <bpmndi:BPMNShape id="Task_ValidarRNC_di" bpmnElement="Task_ValidarRNC">
        <dc:Bounds x="480" y="325" width="130" height="80" />
      </bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="Gateway_Deuda_di" bpmnElement="Gateway_Deuda" isMarkerVisible="true">
        <dc:Bounds x="650" y="340" width="50" height="50" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="635" y="397" width="80" height="40" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="Task_GenerarFirmaQR_di" bpmnElement="Task_GenerarFirmaQR">
        <dc:Bounds x="740" y="295" width="130" height="80" />
      </bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="Task_NotificarDeuda_di" bpmnElement="Task_NotificarDeuda">
        <dc:Bounds x="740" y="390" width="130" height="60" />
      </bpmndi:BPMNShape>

      <!-- Flujos -->
      <bpmndi:BPMNEdge id="Flow_1_di" bpmnElement="Flow_1">
        <di:waypoint x="276" y="160" />
        <di:waypoint x="330" y="160" />
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="Flow_2_di" bpmnElement="Flow_2">
        <di:waypoint x="460" y="160" />
        <di:waypoint x="470" y="160" />
        <di:waypoint x="470" y="365" />
        <di:waypoint x="480" y="365" />
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="Flow_3_di" bpmnElement="Flow_3">
        <di:waypoint x="610" y="365" />
        <di:waypoint x="650" y="365" />
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="Flow_AlDia_di" bpmnElement="Flow_AlDia">
        <di:waypoint x="675" y="340" />
        <di:waypoint x="675" y="335" />
        <di:waypoint x="740" y="335" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="668" y="313" width="88" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="Flow_4_di" bpmnElement="Flow_4">
        <di:waypoint x="805" y="295" />
        <di:waypoint x="805" y="160" />
        <di:waypoint x="830" y="160" />
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="Flow_5_di" bpmnElement="Flow_5">
        <di:waypoint x="960" y="160" />
        <di:waypoint x="1000" y="160" />
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="Flow_ConDeuda_di" bpmnElement="Flow_ConDeuda">
        <di:waypoint x="675" y="390" />
        <di:waypoint x="675" y="420" />
        <di:waypoint x="740" y="420" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="670" y="423" width="74" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="Flow_6_di" bpmnElement="Flow_6">
        <di:waypoint x="870" y="420" />
        <di:waypoint x="970" y="420" />
        <di:waypoint x="970" y="228" />
        <di:waypoint x="1000" y="228" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

export const dgiiECFXML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                  xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
                  id="Defs_DGII_eCF"
                  targetNamespace="http://dgii.gov.do/bpmn">
  <bpmn:process id="Process_eCF" isExecutable="false">
    <bpmn:startEvent id="Start_eCF" name="Nelson Miñoso solicita pase a Facturación Electrónica (e-CF)">
      <bpmn:outgoing>F1</bpmn:outgoing>
    </bpmn:startEvent>

    <bpmn:task id="Task_Certificado" name="Presentar Certificado Digital Tributario vigente">
      <bpmn:incoming>F1</bpmn:incoming>
      <bpmn:outgoing>F2</bpmn:outgoing>
    </bpmn:task>
    <bpmn:sequenceFlow id="F1" sourceRef="Start_eCF" targetRef="Task_Certificado" />

    <bpmn:task id="Task_Pruebas" name="Ejecutar set de pruebas de integración con API DGII">
      <bpmn:incoming>F2</bpmn:incoming>
      <bpmn:outgoing>F3</bpmn:outgoing>
    </bpmn:task>
    <bpmn:sequenceFlow id="F2" sourceRef="Task_Certificado" targetRef="Task_Pruebas" />

    <bpmn:exclusiveGateway id="Gate_Pruebas" name="¿Set de pruebas completado exitosamente?">
      <bpmn:incoming>F3</bpmn:incoming>
      <bpmn:outgoing>F_Aprobado</bpmn:outgoing>
      <bpmn:outgoing>F_Rechazado</bpmn:outgoing>
    </bpmn:exclusiveGateway>
    <bpmn:sequenceFlow id="F3" sourceRef="Task_Pruebas" targetRef="Gate_Pruebas" />

    <bpmn:task id="Task_AsignarRangos" name="Asignar secuencias autorizadas de e-CF (E31, E32, E34)">
      <bpmn:incoming>F_Aprobado</bpmn:incoming>
      <bpmn:outgoing>F4</bpmn:outgoing>
    </bpmn:task>
    <bpmn:sequenceFlow id="F_Aprobado" name="Pruebas aprobadas" sourceRef="Gate_Pruebas" targetRef="Task_AsignarRangos" />

    <bpmn:task id="Task_Resolucion" name="Emitir resolución de Emisor Electrónico a Nelson Miñoso">
      <bpmn:incoming>F4</bpmn:incoming>
      <bpmn:outgoing>F5</bpmn:outgoing>
    </bpmn:task>
    <bpmn:sequenceFlow id="F4" sourceRef="Task_AsignarRangos" targetRef="Task_Resolucion" />

    <bpmn:endEvent id="End_eCF_Activo" name="Emisor electrónico activo y facturando">
      <bpmn:incoming>F5</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="F5" sourceRef="Task_Resolucion" targetRef="End_eCF_Activo" />

    <bpmn:task id="Task_Ajustes" name="Emitir informe técnico de errores a subsanar">
      <bpmn:incoming>F_Rechazado</bpmn:incoming>
      <bpmn:outgoing>F6</bpmn:outgoing>
    </bpmn:task>
    <bpmn:sequenceFlow id="F_Rechazado" name="Errores de esquema XML" sourceRef="Gate_Pruebas" targetRef="Task_Ajustes" />

    <bpmn:endEvent id="End_eCF_Pendiente" name="Ajustes técnicos pendientes">
      <bpmn:incoming>F6</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="F6" sourceRef="Task_Ajustes" targetRef="End_eCF_Pendiente" />
  </bpmn:process>

  <bpmndi:BPMNDiagram id="BPMNDiagram_eCF">
    <bpmndi:BPMNPlane id="BPMNPlane_eCF" bpmnElement="Process_eCF">
      <bpmndi:BPMNShape id="Start_eCF_di" bpmnElement="Start_eCF">
        <dc:Bounds x="180" y="160" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="155" y="203" width="87" height="53" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="Task_Certificado_di" bpmnElement="Task_Certificado">
        <dc:Bounds x="270" y="138" width="130" height="80" />
      </bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="Task_Pruebas_di" bpmnElement="Task_Pruebas">
        <dc:Bounds x="440" y="138" width="130" height="80" />
      </bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="Gate_Pruebas_di" bpmnElement="Gate_Pruebas" isMarkerVisible="true">
        <dc:Bounds x="610" y="153" width="50" height="50" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="595" y="103" width="80" height="40" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="Task_AsignarRangos_di" bpmnElement="Task_AsignarRangos">
        <dc:Bounds x="710" y="138" width="130" height="80" />
      </bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="Task_Resolucion_di" bpmnElement="Task_Resolucion">
        <dc:Bounds x="880" y="138" width="130" height="80" />
      </bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="End_eCF_Activo_di" bpmnElement="End_eCF_Activo">
        <dc:Bounds x="1050" y="160" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="1030" y="203" width="76" height="40" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="Task_Ajustes_di" bpmnElement="Task_Ajustes">
        <dc:Bounds x="710" y="260" width="130" height="80" />
      </bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="End_eCF_Pendiente_di" bpmnElement="End_eCF_Pendiente">
        <dc:Bounds x="890" y="282" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="870" y="325" width="76" height="27" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>

      <bpmndi:BPMNEdge id="F1_di" bpmnElement="F1">
        <di:waypoint x="216" y="178" />
        <di:waypoint x="270" y="178" />
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="F2_di" bpmnElement="F2">
        <di:waypoint x="400" y="178" />
        <di:waypoint x="440" y="178" />
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="F3_di" bpmnElement="F3">
        <di:waypoint x="570" y="178" />
        <di:waypoint x="610" y="178" />
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="F_Aprobado_di" bpmnElement="F_Aprobado">
        <di:waypoint x="660" y="178" />
        <di:waypoint x="710" y="178" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="658" y="160" width="55" height="27" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="F4_di" bpmnElement="F4">
        <di:waypoint x="840" y="178" />
        <di:waypoint x="880" y="178" />
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="F5_di" bpmnElement="F5">
        <di:waypoint x="1010" y="178" />
        <di:waypoint x="1050" y="178" />
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="F_Rechazado_di" bpmnElement="F_Rechazado">
        <di:waypoint x="635" y="203" />
        <di:waypoint x="635" y="300" />
        <di:waypoint x="710" y="300" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="638" y="246" width="74" height="27" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="F6_di" bpmnElement="F6">
        <di:waypoint x="840" y="300" />
        <di:waypoint x="890" y="300" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

export const dgiiRectificativaXML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                  xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
                  id="Defs_DGII_Rectificativa"
                  targetNamespace="http://dgii.gov.do/bpmn">
  <bpmn:process id="Process_Rectificativa" isExecutable="false">
    <bpmn:startEvent id="Start_Rec" name="Nelson Miñoso radica rectificativa de declaración jurada">
      <bpmn:outgoing>R1</bpmn:outgoing>
    </bpmn:startEvent>

    <bpmn:task id="Task_Cruce606" name="Auditar cruces con formatos de compras 606 y ventas 607">
      <bpmn:incoming>R1</bpmn:incoming>
      <bpmn:outgoing>R2</bpmn:outgoing>
    </bpmn:task>
    <bpmn:sequenceFlow id="R1" sourceRef="Start_Rec" targetRef="Task_Cruce606" />

    <bpmn:exclusiveGateway id="Gate_Cruce" name="¿Se justifican variaciones tributarias?">
      <bpmn:incoming>R2</bpmn:incoming>
      <bpmn:outgoing>R_Conforme</bpmn:outgoing>
      <bpmn:outgoing>R_Inconforme</bpmn:outgoing>
    </bpmn:exclusiveGateway>
    <bpmn:sequenceFlow id="R2" sourceRef="Task_Cruce606" targetRef="Gate_Cruce" />

    <bpmn:task id="Task_AprobarRec" name="Aprobar declaración rectificativa en sistema DGII">
      <bpmn:incoming>R_Conforme</bpmn:incoming>
      <bpmn:outgoing>R3</bpmn:outgoing>
    </bpmn:task>
    <bpmn:sequenceFlow id="R_Conforme" name="Justificación aceptada" sourceRef="Gate_Cruce" targetRef="Task_AprobarRec" />

    <bpmn:task id="Task_ActualizarCuenta" name="Actualizar saldo y emitir estado de cuenta a Nelson Miñoso">
      <bpmn:incoming>R3</bpmn:incoming>
      <bpmn:outgoing>R4</bpmn:outgoing>
    </bpmn:task>
    <bpmn:sequenceFlow id="R3" sourceRef="Task_AprobarRec" targetRef="Task_ActualizarCuenta" />

    <bpmn:endEvent id="End_Rec_Ok" name="Declaración rectificada satisfactoriamente">
      <bpmn:incoming>R4</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="R4" sourceRef="Task_ActualizarCuenta" targetRef="End_Rec_Ok" />

    <bpmn:task id="Task_EmitirReparo" name="Emitir pliego de inconsistencias y liquidación provisional">
      <bpmn:incoming>R_Inconforme</bpmn:incoming>
      <bpmn:outgoing>R5</bpmn:outgoing>
    </bpmn:task>
    <bpmn:sequenceFlow id="R_Inconforme" name="Discrepancia persistente" sourceRef="Gate_Cruce" targetRef="Task_EmitirReparo" />

    <bpmn:endEvent id="End_Rec_Reparo" name="Notificación de ajuste tributario enviada">
      <bpmn:incoming>R5</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="R5" sourceRef="Task_EmitirReparo" targetRef="End_Rec_Reparo" />
  </bpmn:process>

  <bpmndi:BPMNDiagram id="BPMNDiagram_Rec">
    <bpmndi:BPMNPlane id="BPMNPlane_Rec" bpmnElement="Process_Rectificativa">
      <bpmndi:BPMNShape id="Start_Rec_di" bpmnElement="Start_Rec">
        <dc:Bounds x="180" y="160" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="155" y="203" width="87" height="53" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="Task_Cruce606_di" bpmnElement="Task_Cruce606">
        <dc:Bounds x="280" y="138" width="140" height="80" />
      </bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="Gate_Cruce_di" bpmnElement="Gate_Cruce" isMarkerVisible="true">
        <dc:Bounds x="470" y="153" width="50" height="50" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="455" y="103" width="80" height="40" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="Task_AprobarRec_di" bpmnElement="Task_AprobarRec">
        <dc:Bounds x="580" y="138" width="140" height="80" />
      </bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="Task_ActualizarCuenta_di" bpmnElement="Task_ActualizarCuenta">
        <dc:Bounds x="770" y="138" width="150" height="80" />
      </bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="End_Rec_Ok_di" bpmnElement="End_Rec_Ok">
        <dc:Bounds x="970" y="160" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="950" y="203" width="76" height="40" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="Task_EmitirReparo_di" bpmnElement="Task_EmitirReparo">
        <dc:Bounds x="580" y="260" width="140" height="80" />
      </bpmndi:BPMNShape>

      <bpmndi:BPMNShape id="End_Rec_Reparo_di" bpmnElement="End_Rec_Reparo">
        <dc:Bounds x="780" y="282" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="760" y="325" width="76" height="40" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>

      <bpmndi:BPMNEdge id="R1_di" bpmnElement="R1">
        <di:waypoint x="216" y="178" />
        <di:waypoint x="280" y="178" />
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="R2_di" bpmnElement="R2">
        <di:waypoint x="420" y="178" />
        <di:waypoint x="470" y="178" />
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="R_Conforme_di" bpmnElement="R_Conforme">
        <di:waypoint x="520" y="178" />
        <di:waypoint x="580" y="178" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="518" y="146" width="62" height="27" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="R3_di" bpmnElement="R3">
        <di:waypoint x="720" y="178" />
        <di:waypoint x="770" y="178" />
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="R4_di" bpmnElement="R4">
        <di:waypoint x="920" y="178" />
        <di:waypoint x="970" y="178" />
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="R_Inconforme_di" bpmnElement="R_Inconforme">
        <di:waypoint x="495" y="203" />
        <di:waypoint x="495" y="300" />
        <di:waypoint x="580" y="300" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="498" y="246" width="65" height="27" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNEdge>

      <bpmndi:BPMNEdge id="R5_di" bpmnElement="R5">
        <di:waypoint x="720" y="300" />
        <di:waypoint x="780" y="300" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;
