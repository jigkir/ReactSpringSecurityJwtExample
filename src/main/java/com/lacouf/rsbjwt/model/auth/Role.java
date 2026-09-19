package com.lacouf.rsbjwt.model.auth;

import java.util.HashSet;
import java.util.Set;

public enum Role{
	MANAGER,
	PREPOSE,
	EMPRUNTEUR,
    STUDENT,
	TEACHER,
	EMPLOYER;



	private final Set<Role> managedRoles = new HashSet<>();

	static{
		MANAGER.managedRoles.add(PREPOSE);
		MANAGER.managedRoles.add(EMPRUNTEUR);
	}


}
