function validateFields() {
	clearWarnings();
	
	var valid = true;
	valid &=validateInput('#O2' );
	valid &=validateInput('#NO3');
	valid &=validateInput('#Mn' );
	valid &=validateInput('#Fe' );
	valid &=validateInput('#SO4');
	valid &=validateInput('#H2S');
	
	return valid;
}
function validateInput(input) {
	if ( $(input).val().trim() === "" ) return true;
	if ( ! isNumber( $(input).val() ) ) {
		$(input).parent().find('div.warning').html('Must be a number!');
		return false;
	}
	if ( Number( $(input).val() ) < 0) {
		$(input).parent().find('div.warning').html('Cannot be negative!');
	}
	return true;
}

function calcFeSO4(Fe,unitsFe,H2S,unitsH2S) {
	var FeSO4 = 0;
	if ((unitsFe == "millig/L" && unitsH2S == "millig/L") 
	 || (unitsFe != "millig/L" && unitsH2S != "millig/L")) {
		FeSO4 = Fe / H2S;
	} else if (unitsFe == "millig/L" && unitsH2S != "millig/L") {
		FeSO4 = (Fe / 1000) / H2S;
	} else if (unitsFe != "millig/L" && unitsH2S == "millig/L") {
		FeSO4 = Fe / (H2S / 1000);
	}
	return Math.round(FeSO4*1000)/1000.0;
}

function mcMahonAndChapelleRedox() {
	if ( ! validateFields() ) return;
	
    var category = "Indeterminate";
	var process  = "Unknown";
	var FeSO4    = "";

	var O2  = Number( $('#O2' ).val() ); //3
	var NO3 = Number( $('#NO3').val() ); //4
	var Mn  = Number( $('#Mn' ).val() ); //5
	var Fe  = Number( $('#Fe' ).val() ); //6
	var SO4 = Number( $('#SO4').val() ); //7
	var H2S = Number( $('#H2S').val() ); //8

	var unitsFe   = $('#units').val(); //millig/L
	var unitsH2S  = $('#units').val(); //microg/L
	
	var threshO2  =   0.5;
	var threshNO3 =   0.5;
	var threshMn  =  50.0/1000.0;
	var threshFe  = 100.0/1000.0;
	var threshSO4 =   0.5;
	var threshH2S =   0.5;

	
	var hasSulfide= false;
	var paramCount= 0;
	if (O2 >0) paramCount++;
	if (NO3>0) paramCount++;
	if (Mn >0) paramCount++;
	if (Fe >0) paramCount++;
	if (SO4>0) paramCount++;
	if (H2S>0) {
		paramCount++;
		hasSulfide = true;
	}

    if ((paramCount == 5 && ! hasSulfide) 
	  || paramCount == 6) {
	
        if (O2 >= threshO2) {
            category = "Oxic";
            process  = "O2";
            
			if (Mn >= threshMn || Fe >= threshFe) {
                category = "Mixed(oxic-anoxic)";
                
				if (Mn >= threshMn && Fe < threshFe) {
                    process += "-Mn(IV)";
                } else if (Fe >= threshFe && SO4 >= threshSO4) {
                    
					if (paramCount == 6) {
						FeSO4 = calcFeSO4(Fe,unitsFe,H2S,unitsH2S);
                        if (FeSO4 < 0.3) {
                            process += "-SO4";
                        } else if (FeSO4 >= 0.3 && FeSO4 <= 10) {
                            process += "-Fe(III)-SO4";
                        } else {
                            process += "-Fe(III)";
                        }
                    } else {
                        process += "-Fe(III)/SO4";
                    }
                } else {
                    process += "-CH4gen";
                }
            }
        } else {
            
			if (NO3 >= threshNO3) {
                category = "Anoxic";
                process  = "NO3";
                
				if (Mn >= threshMn || Fe >= threshFe) {
                    category = "Mixed(anoxic)";
                    
					if (Mn >= threshMn && Fe < threshFe) {
                        process += "-Mn(IV)";
                    } else if (Fe >= threshFe && SO4 >= threshSO4) {
                        
						if (paramCount == 6) {
							FeSO4 = calcFeSO4(Fe,unitsFe,H2S,unitsH2S);
                            
							if (FeSO4 < 0.3) {
                                process += "-SO4";
                            } else if (FeSO4 >= 0.3 && FeSO4 <= 10) {
                                process += "-Fe(III)-SO4";
                            } else {
                                process += "-Fe(III)";
                            }
                        } else {
                            process += "-Fe(III)/SO4";
                        }
                    } else {
                        process += "-CH4gen";
                    }
                }
            } else {
                
				if (Mn >= threshMn && Fe < threshFe) {
                    category = "Anoxic";
                    process  = "Mn(IV)";
                } else {
                    
					if (Fe >= threshFe && SO4 >= threshSO4) {
                        
						if (paramCount == 6) {
							FeSO4 = calcFeSO4(Fe,unitsFe,H2S,unitsH2S);
                            
							if (FeSO4 < 0.3) {
                                process  = "SO4";
                                category = "Anoxic";
                            } else if (FeSO4 >= 0.3 && FeSO4 <= 10) {
                                process  = "Fe(III)-SO4";
                                category = "Mixed(anoxic)";
                            } else {
                                process  = "Fe(III)";
                                category = "Anoxic";
                            }
                        } else {
                            process  = "Fe(III)/SO4";
                            category = "Anoxic";
                        }
                    } else if (Fe >= threshFe && SO4 < threshSO4) {
                        process  = "CH4gen";
                        category = "Anoxic";
                    } else {
                        process  = "Suboxic";
                        category = "Suboxic";
                    }
                }
            }
        }
		
    } else if ( O2 > 0 ) {
        
		if (O2 < threshO2) {
            category = "O2 < " + threshO2 + " mg/L";
        } else {
            category = "O2 >= " + threshO2 + " mg/L";
        }
		
    } else if (paramCount >= 4 && !(O2 > 0) ) {
        if (NO3 >= threshNO3) {
            category = "OxicOrAnoxic";
            process  = "O2?OrNO3";
            
			if (Mn >= threshMn || Fe >= threshFe) {
                category = "Mixed(anoxic)Or(oxic-anoxic)";
                
				if (Mn >= threshMn && Fe < threshFe) {
                    process = "Mn(IV)-" + process;
                } else if (Fe >= threshFe && SO4 >= threshSO4) {
                    
					if (hasSulfide) {
						FeSO4 = calcFeSO4(Fe,unitsFe,H2S,unitsH2S);
						
                        if (FeSO4 < 0.3) {
                            process = "SO4-" + process;
                        } else if (FeSO4 >= 0.3 && FeSO4 <= 10) {
                            process = "Fe(III)-SO4-" + process;
                        } else {
                            process = "Fe(III)-" + process;
                        }
                    } else {
                        process = "Fe(III)/SO4-" + process;
                    }
                } else {
                    process = "CH4gen-" + process;
                }
            }
        } else {
            if (Mn >= threshMn && Fe < threshFe) {
                category = "AnoxicOrMixed(oxic-anoxic)";
                process  = "Mn(IV)-O2?";
            } else {
                
				if (Fe >= threshFe && SO4 >= threshSO4) {
                    
					if (hasSulfide) {
						FeSO4 = calcFeSO4(Fe,unitsFe,H2S,unitsH2S);
                        
						if (FeSO4 < 0.3) {
                            category = "AnoxicOrMixed(oxic-anoxic)";
                            process  = "SO4-O2?";
                        } else if (FeSO4 >= 0.3 && FeSO4 <= 10) {
                            category = "Mixed(anoxic)";
                            process  = "Fe(III)-SO4-O2?";
                        } else {
                            category = "AnoxicOrMixed(oxic-anoxic)";
                            process  = "Fe(III)-O2?";
                        }
                    } else {
                        category = "AnoxicOrMixed(oxic-anoxic)";
                        process  = "Fe(III)/SO4-O2?";
                    }
                } else if (Fe >= threshFe && SO4 < threshSO4) {
                    process  = "CH4gen-O2?";
                    category = "AnoxicOrMixed(oxic-anoxic)";
                } else {
                    process  = "O2?OrSuboxic";
                    category = "OxicOrSuboxic";
                }
            }
        }
    }
	$('#category').html(category);
	$('#process').html(process);
	$('#FeSO4').html(FeSO4);

}

$().ready( function() {
	$('#calculate').click(mcMahonAndChapelleRedox);
	$('#clear').click( function() {
		$('#category').html("");
		$('#process').html("");
		$('#FeSO4').html("");
		clearWarnings();
	});
});
function clearWarnings() {
	$('div.warning').each( function(){
		$(this).html('');
	});
}
