package controllers;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mercadopago.MercadoPagoConfig;
import com.mercadopago.client.preference.PreferenceBackUrlsRequest;
import com.mercadopago.client.preference.PreferenceClient;
import com.mercadopago.client.preference.PreferenceItemRequest;
import com.mercadopago.client.preference.PreferenceRequest;
import com.mercadopago.exceptions.MPApiException;
import com.mercadopago.exceptions.MPException;
import com.mercadopago.resources.preference.Preference;

import entities.Usuario;
import services.CarritoDeComprasServiceImpl;
import services.MercadoPagoService;


@RestController
@RequestMapping("/api/v1/mp")
public class MercadoPagoController {

	@Value("${MP_ACCESS_TOKEN}")
	private String accessToken;
	
	@Autowired
    private CarritoDeComprasServiceImpl carritoService;
	
	 
	private MercadoPagoService mercadoPagoService;

    private static final Logger logger = LoggerFactory.getLogger(MercadoPagoController.class);


	@GetMapping("/pago")
	public ResponseEntity<Map<String, String>> createAndRedirect(Authentication authentication) throws MPException, MPApiException{
		
		try {
			MercadoPagoConfig.setAccessToken(accessToken);
			
			// Obtenemos el usuario autenticado
	        Usuario usuario = (Usuario) authentication.getPrincipal();
	        // Obtenesmo los productos que tiene el usuario en el carrito
	        List<Map<String, Object>> productosCarrito = carritoService.obtenerProductosCarrito(usuario.getIdUsuario());
	        
	        List<PreferenceItemRequest> items = new ArrayList<>();
	        
	        for (Map<String, Object> producto : productosCarrito) {
	            PreferenceItemRequest itemRequest = PreferenceItemRequest.builder()
	                .id(producto.get("id").toString()) 
	                .title((String) producto.get("nombre")) 
	                .quantity(((Number) producto.get("cantidad")).intValue()) 
	                .currencyId("ARS") // Peso argentino 
	                .unitPrice(new BigDecimal(producto.get("precio").toString()))
	                .build();
	            
	            items.add(itemRequest);
	        }
	        
	        PreferenceBackUrlsRequest backUrls = PreferenceBackUrlsRequest.builder()
	        		.success("https://groove-records-nag2.onrender.com/success.html") // URL PAGO CONFIRMADO
	        		.pending("https://groove-records-nag2.onrender.com/carrito.html") // URL PAGO PENDIENTE
	        		.failure("https://groove-records-nag2.onrender.com/carrito.html") // URL PAGO FALLIDO
	        		.build();
	        
	        logger.info("Back URLs configuradas: Success={}, Pending={}, Failure={}",
	                backUrls.getSuccess(), backUrls.getPending(), backUrls.getFailure());
	        
	        PreferenceRequest preferenceRequest = PreferenceRequest.builder()
	                .items(items)
	                .backUrls(backUrls)
	                .notificationUrl("") //URL DONDE DEBERIA LLEGAR LA NOTIFICACION DE EN QUE ESTADO QUEDO EL PAGO
	                .autoReturn("approved")
	                .build();
	        
	        logger.info("PreferenceRequest creado con autoReturn: {}", preferenceRequest.getAutoReturn());

	        PreferenceClient client = new PreferenceClient();
	        Preference preference = client.create(preferenceRequest);

	        // Redirigir al usuario al checkout de Mercado Pago
	        Map<String, String> response = new HashMap<>();
	        response.put("url", preference.getInitPoint());
	        
	        return ResponseEntity.ok(response);
		} catch (MPApiException e) {
		    logger.error("MPApiException - Status Code: " + e.getStatusCode());
		    logger.error("MPApiException - Response Content: " + e.getApiResponse().getContent());
		    throw e;
		} catch (Exception e) {
		    logger.error("Error inesperado: " + e.getMessage(), e);
		    throw e;
		}
		
	}
	
	// METODO PARA RECIBIR LAS NOTIFICACIONES DE MERCADO PAGO
	// SE NECESITA UNA URL PUBLICA PARA QUE MP NOS ENVIE LA NOTIFICACION Y NOSOTROS PODAMOS RECIBIRLA 
	@PostMapping("/notificacion")
	public ResponseEntity<String> notificacion(@RequestBody Map<String, Object> payload){
		
		logger.info("Notificacion recibida de MERCADO PAGO: " + payload);
		
		// OBTENEMOS LA NOTIFICACION Y LA CONVERTIMOS A STRING
		String tipo = (String) payload.get("type");
		Map<String, Object> data =(Map<String, Object>) payload.get("data");
		
		// ACA MANEJARIAMOS LA LOGICA PARA LA NOTIFICACION DE MERCADO PAGO
		// POR AHORA NO HASTA TENER UNA URL PUBLICAS
		
		if (data != null && "payment".equals(tipo)) {
			
			String paymentIdString = data.get("id").toString();
			Long paymentId = Long.parseLong(paymentIdString);
			String paymentStatus = mercadoPagoService.getPaymentStatus(paymentId);

		        // Dependiendo del estado, rediriges a success o failure
		        if ("approved".equals(paymentStatus)) {
		            // Redirigir manualmente a success.html
		            return ResponseEntity.status(HttpStatus.FOUND)
		                .header(HttpHeaders.LOCATION, "http://localhost:8080/success.html")
		                .build();
		        } else {
		            return ResponseEntity.status(HttpStatus.FOUND)
		                .header(HttpHeaders.LOCATION, "http://localhost:8080/failure.html")
		                .build();
		        }
		    }
			
			
			// ADENTRO DEL TRY MANEJARIAMOS LOS ESTADOS (APROBADO, PENDIENTE Y FALLIDO)
			try {
				
			} catch (Exception e) {
				logger.error("ERROR al obtener el estado del pago: " + e.getMessage());
			}
			
		
		return ResponseEntity.ok("Notificacion Procesada");
	}


}